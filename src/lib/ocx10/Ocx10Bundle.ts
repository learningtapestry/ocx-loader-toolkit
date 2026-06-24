import { Bundle as PrismaBundle, Node as PrismaNode, Prisma, PrismaClient } from "@prisma/client"

import OcxBundle from "../OcxBundle"

import {
  lmsActivityResolutionErrorToBundleError,
  resolveLmsActivityForMaterial,
} from "./lmsActivity"
import { packageTransport } from "./importOcx10Package"
import { collectMaterialIdsForUnit } from "./collectUnitSubtree"
import { normalizeHasPart, skippedLinksToBundleErrors } from "./normalizeHasPart"
import { findRootEntity, Ocx10Package } from "./Ocx10Package"
import { LocalOcx10PackageSource } from "./Ocx10PackageSource"
import {
  representationResolutionErrorToBundleError,
  resolveRepresentationsForMaterial,
} from "./resolveMaterialRepresentations"
import { Ocx10CurriculumEntity, Ocx10LoadedEntity, Ocx10LoadedMaterial } from "./types"

type ImportLoadedEntitiesOptions = {
  pkg: Ocx10Package
  loadedEntities: Ocx10LoadedEntity[]
  loadedMaterials: Ocx10LoadedMaterial[]
  rootEntity: Ocx10CurriculumEntity
  courseEntity?: Ocx10CurriculumEntity
  unitPath?: string
  transport?: "local" | "http"
}

export default class Ocx10Bundle extends OcxBundle {
  async importFromLocalPackage(
    db: PrismaClient,
    source: LocalOcx10PackageSource
  ): Promise<PrismaBundle> {
    const pkg = await Ocx10Package.openFromSource(source)
    const loadedEntities = await pkg.loadAllCurriculumEntities()
    const rootEntity = findRootEntity(loadedEntities.map((item) => item.entity))

    if (!rootEntity) {
      throw new Error("No root curriculum entity found in package")
    }

    if (rootEntity["@type"] === "Course") {
      throw new Error(
        "Course-root packages must be imported via importOcx10Package (creates one bundle per unit)"
      )
    }

    const materialIds = collectMaterialIdsForUnit(rootEntity["@id"], loadedEntities)
    const loadedMaterials = await pkg.loadMaterials(materialIds)

    return this.importLoadedEntities(db, {
      pkg,
      loadedEntities,
      loadedMaterials,
      rootEntity,
      transport: packageTransport(source),
    })
  }

  async importLoadedEntities(
    db: PrismaClient,
    options: ImportLoadedEntitiesOptions
  ): Promise<PrismaBundle> {
    const { pkg, loadedEntities, loadedMaterials, rootEntity, courseEntity, unitPath, transport } =
      options

    await db.bundle.update({
      where: { id: this.prismaBundle.id },
      data: { importStatus: "processing" },
    })

    try {
      const { nodes, assetValidation } = await this.createNodesFromOcx10Entities(
        db,
        loadedEntities,
        loadedMaterials,
        pkg
      )

      await this.assignParentsToNodes(db, nodes)
      await this.reloadFromDb(db)

    const unitAbout = rootEntity.description as string | undefined
    const unitAlternateName =
      "ordinalName" in rootEntity ? (rootEntity.ordinalName as string | undefined) : undefined
      const fullCourseName =
        unitAlternateName && unitAbout
          ? `${unitAlternateName}: ${unitAbout}`
          : (rootEntity.name as string | undefined) || pkg.manifest.name

      await db.bundle.update({
        where: { id: this.prismaBundle.id },
        data: {
          sitemapUrl: "ocx10://local",
          parsedSitemap: Prisma.DbNull,
          importStatus: "completed",
          importMetadata: {
            format: "ocx@1.0.0",
            importScope: "unit",
            packageRoot: pkg.packageRoot,
            transport: transport ?? packageTransport(pkg.source),
            assetValidation,
            inLanguage: pkg.manifest.inLanguage,
            manifestId: pkg.manifest["@id"],
            manifestName: pkg.manifest.name,
            ...(courseEntity
              ? {
                  courseEntityId: courseEntity["@id"],
                  courseName: courseEntity.name,
                }
              : {}),
            rootEntityId: rootEntity["@id"],
            rootEntityType: rootEntity["@type"],
            unitPath,
            unitCode: unitPath ? unitCodeFromPath(unitPath) : undefined,
            course_chapter: unitAlternateName,
            course_about: unitAbout,
            full_course_name: fullCourseName,
          },
          name: this.prismaBundle.name || (rootEntity.name as string),
        },
      })

      await this.reloadFromDb(db)

      return this.prismaBundle
    } catch (error) {
      await db.bundle.update({
        where: { id: this.prismaBundle.id },
        data: { importStatus: "failed" },
      })

      throw error
    }
  }

  async assignParentsToNodes(db: PrismaClient, nodes: PrismaNode[]) {
    const errors = this.prismaBundle.errors as Prisma.JsonObject[]

    for (const node of nodes) {
      const metadata = node.metadata as Prisma.JsonObject
      const parts = (metadata.hasPart || []) as Prisma.JsonObject[]

      for (const childData of parts) {
        if (childData["@type"] === "Material") {
          continue
        }

        const ocxId = childData["@id"] as string
        const child = nodes.find((n) => (n.metadata as Prisma.JsonObject)["@id"] === ocxId)

        if (child) {
          await db.node.update({
            where: { id: child.id },
            data: {
              parentId: node.id,
            },
          })
        } else {
          errors.push({
            node: (node.metadata as Prisma.JsonObject)["@id"],
            message: `Child not found: ${ocxId}`,
          })
        }
      }
    }

    if (errors.length > (this.prismaBundle.errors as Prisma.JsonObject[]).length) {
      await db.bundle.update({
        where: { id: this.prismaBundle.id },
        data: {
          errors,
        },
      })
    }
  }

  async createNodesFromOcx10Entities(
    db: PrismaClient,
    loadedEntities: Ocx10LoadedEntity[],
    loadedMaterials: Ocx10LoadedMaterial[],
    pkg: Ocx10Package
  ): Promise<{ nodes: PrismaNode[]; assetValidation: { checked: number; missing: number; external: number } }> {
    await db.nodeExport.deleteMany({
      where: { nodeId: { in: this.ocxNodes.map((node) => node.prismaNode.id) } },
    })

    await db.node.deleteMany({
      where: { bundleId: this.prismaBundle.id },
    })

    await db.bundle.update({
      where: { id: this.prismaBundle.id },
      data: {
        errors: [],
      },
    })
    this.prismaBundle.errors = []

    const entitiesById = new Map<string, Ocx10CurriculumEntity>(
      loadedEntities.map((item) => [item.entity["@id"], item.entity])
    )
    const materialsById = new Map(loadedMaterials.map((item) => [item.entity["@id"], item.entity]))

    const allSkippedLinks = loadedEntities.flatMap((item) => {
      const { skippedLinks } = normalizeHasPart(
        item.entity["@id"],
        item.entity.hasPart,
        entitiesById,
        materialsById
      )
      return skippedLinks
    })

    const bundleErrors: Prisma.JsonObject[] = skippedLinksToBundleErrors(allSkippedLinks)
    const assetValidation = { checked: 0, missing: 0, external: 0 }

    const curriculumNodes = await Promise.all(
      loadedEntities.map(async (item) => {
        const { hasPart } = normalizeHasPart(
          item.entity["@id"],
          item.entity.hasPart,
          entitiesById,
          materialsById
        )

        const metadata = {
          ...(item.entity as unknown as Prisma.JsonObject),
          hasPart: hasPart as unknown as Prisma.JsonArray,
        } satisfies Prisma.JsonObject

        return db.node.create({
          data: {
            url: item.path,
            content: "",
            metadata,
            bundleId: this.prismaBundle.id,
          },
        })
      })
    )

    const materialNodes = await Promise.all(
      loadedMaterials.map(async (item) => {
        const [lmsResolution, representationResolution] = await Promise.all([
          resolveLmsActivityForMaterial(pkg.source, item.entity),
          resolveRepresentationsForMaterial(pkg.source, item.entity),
        ])

        assetValidation.checked += representationResolution.stats.checked
        assetValidation.missing += representationResolution.stats.missing
        assetValidation.external += representationResolution.stats.external

        const metadata: Prisma.JsonObject = {
          ...(item.entity as Prisma.JsonObject),
          resolvedRepresentations:
            representationResolution.resolvedRepresentations as unknown as Prisma.JsonArray,
          ...(lmsResolution.lmsActivity
            ? { lmsActivity: lmsResolution.lmsActivity as unknown as Prisma.JsonObject }
            : {}),
        }

        if (lmsResolution.error) {
          bundleErrors.push(lmsActivityResolutionErrorToBundleError(lmsResolution.error))
        }

        for (const error of representationResolution.errors) {
          bundleErrors.push(representationResolutionErrorToBundleError(error))
        }

        return db.node.create({
          data: {
            url: item.path,
            content: (item.entity.content as string | undefined) || "",
            metadata,
            bundleId: this.prismaBundle.id,
          },
        })
      })
    )

    const nodes = [...curriculumNodes, ...materialNodes]
    const ocxIds: string[] = []

    const updatedNodes = await Promise.all(
      nodes.map(async (node) => {
        const metadata = node.metadata as Prisma.JsonObject

        if (ocxIds.includes(metadata["@id"] as string)) {
          const newOcxId = `${metadata["@id"]}-${node.id}`

          bundleErrors.push({
            nodeId: node.id,
            ocxId: metadata["@id"],
            message: "Duplicate @id",
          })

          ocxIds.push(newOcxId)

          return db.node.update({
            where: { id: node.id },
            data: {
              metadata: {
                ...metadata,
                "@id": newOcxId,
              },
            },
          })
        }

        ocxIds.push(metadata["@id"] as string)

        return node
      })
    )

    await this.appendErrors(db, bundleErrors)

    return { nodes: updatedNodes, assetValidation }
  }
}

function unitCodeFromPath(unitPath: string): string | undefined {
  const baseName = unitPath.split("/").pop()?.replace(/\.json$/i, "") ?? ""
  const segments = baseName.split("-")
  return segments[segments.length - 1] || undefined
}
