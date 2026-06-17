import { Bundle as PrismaBundle, Node as PrismaNode, Prisma, PrismaClient } from "@prisma/client"

import OcxBundle from "../OcxBundle"

import { normalizeHasPart, skippedLinksToBundleErrors } from "./normalizeHasPart"
import { findRootEntity, Ocx10Package } from "./Ocx10Package"
import { Ocx10CurriculumEntity, Ocx10LoadedEntity } from "./types"

export default class Ocx10Bundle extends OcxBundle {
  async importFromLocalPackage(db: PrismaClient, packageRoot: string): Promise<PrismaBundle> {
    await db.bundle.update({
      where: { id: this.prismaBundle.id },
      data: { importStatus: "processing" },
    })

    try {
      const pkg = await Ocx10Package.open(packageRoot)
      const loadedEntities = await pkg.loadAllCurriculumEntities()

      const nodes = await this.createNodesFromOcx10Entities(db, loadedEntities)

      await this.assignParentsToNodes(db, nodes)
      await this.reloadFromDb(db)

      const rootEntity = findRootEntity(loadedEntities.map((item) => item.entity))
      const fullCourseName =
        (rootEntity?.name as string | undefined) || pkg.manifest.name

      await db.bundle.update({
        where: { id: this.prismaBundle.id },
        data: {
          sitemapUrl: "ocx10://local",
          parsedSitemap: Prisma.DbNull,
          importStatus: "completed",
          importMetadata: {
            format: "ocx@1.0.0",
            packageRoot: pkg.packageRoot,
            inLanguage: pkg.manifest.inLanguage,
            manifestId: pkg.manifest["@id"],
            manifestName: pkg.manifest.name,
            rootEntityId: rootEntity?.["@id"],
            rootEntityType: rootEntity?.["@type"],
            full_course_name: fullCourseName,
          },
          name: this.prismaBundle.name || pkg.manifest.name,
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
