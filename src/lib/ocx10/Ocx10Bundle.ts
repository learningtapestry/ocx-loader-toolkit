import { Bundle as PrismaBundle, Node as PrismaNode, Prisma, PrismaClient } from "@prisma/client"

import OcxBundle from "../OcxBundle"

import { normalizeHasPart, skippedLinksToBundleErrors } from "./normalizeHasPart"
import { findRootEntity, Ocx10Package } from "./Ocx10Package"
import { LocalOcx10PackageSource } from "./Ocx10PackageSource"
import { Ocx10CurriculumEntity, Ocx10LoadedEntity } from "./types"

type ImportLoadedEntitiesOptions = {
  pkg: Ocx10Package
  loadedEntities: Ocx10LoadedEntity[]
  rootEntity: Ocx10CurriculumEntity
  courseEntity?: Ocx10CurriculumEntity
  unitPath?: string
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
        "Course-root packages must be imported via importOcx10LocalPackage (creates one bundle per unit)"
      )
    }

    return this.importLoadedEntities(db, {
      pkg,
      loadedEntities,
      rootEntity,
    })
  }

  async importLoadedEntities(
    db: PrismaClient,
    options: ImportLoadedEntitiesOptions
  ): Promise<PrismaBundle> {
    const { pkg, loadedEntities, rootEntity, courseEntity, unitPath } = options

    await db.bundle.update({
      where: { id: this.prismaBundle.id },
      data: { importStatus: "processing" },
    })

    try {
      const nodes = await this.createNodesFromOcx10Entities(db, loadedEntities)

      await this.assignParentsToNodes(db, nodes)
      await this.reloadFromDb(db)

      const unitAbout = rootEntity.description as string | undefined
      const unitAlternateName = rootEntity.ordinalName as string | undefined
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

  async createNodesFromOcx10Entities(
    db: PrismaClient,
    loadedEntities: Ocx10LoadedEntity[]
  ): Promise<PrismaNode[]> {
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

    const allSkippedLinks = loadedEntities.flatMap((item) => {
      const { skippedLinks } = normalizeHasPart(
        item.entity["@id"],
        item.entity.hasPart,
        entitiesById
      )
      return skippedLinks
    })

    const bundleErrors: Prisma.JsonObject[] = skippedLinksToBundleErrors(allSkippedLinks)

    const nodes = await Promise.all(
      loadedEntities.map(async (item) => {
        const { hasPart } = normalizeHasPart(item.entity["@id"], item.entity.hasPart, entitiesById)

        const metadata: Prisma.JsonObject = {
          ...item.entity,
          hasPart,
        }

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

    return updatedNodes
  }
}

function unitCodeFromPath(unitPath: string): string | undefined {
  const baseName = unitPath.split("/").pop()?.replace(/\.json$/i, "") ?? ""
  const segments = baseName.split("-")
  return segments[segments.length - 1] || undefined
}
