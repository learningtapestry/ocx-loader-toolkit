import { PrismaClient } from "@prisma/client"

import {
  collectMaterialIdsForUnit,
  filterLoadedEntitiesForUnit,
  getCourseUnitEntities,
} from "./collectUnitSubtree"
import { isUnitLessonGrouping } from "./curriculumTypes"
import Ocx10Bundle from "./Ocx10Bundle"
import { findRootEntity, Ocx10Package } from "./Ocx10Package"
import { HttpOcx10PackageSource, Ocx10PackageSource } from "./Ocx10PackageSource"
import { Ocx10LoadedEntity } from "./types"

function unitBundleName(
  namePrefix: string | undefined,
  courseName: string,
  unitName: string
): string {
  const prefix = namePrefix || courseName
  return `${prefix} — ${unitName}`
}

export function packageTransport(source: Ocx10PackageSource): "local" | "http" {
  if (source instanceof HttpOcx10PackageSource) {
    return "http"
  }

  return "local"
}

export async function importOcx10Package(
  db: PrismaClient,
  source: Ocx10PackageSource,
  bundleNamePrefix?: string
): Promise<Ocx10Bundle[]> {
  const pkg = await Ocx10Package.openFromSource(source)
  const loadedEntities = await pkg.loadAllCurriculumEntities()
  const rootEntity = findRootEntity(loadedEntities.map((item) => item.entity))

  if (!rootEntity) {
    throw new Error("No root curriculum entity found in package")
  }

  if (rootEntity["@type"] === "Course") {
    console.warn(
      "Course-root package detected: creating one bundle per unit (API-style import)"
    )

    const loadedById = new Map<string, Ocx10LoadedEntity>(
      loadedEntities.map((item) => [item.entity["@id"], item])
    )
    const unitEntities = getCourseUnitEntities(rootEntity, loadedById)

    if (unitEntities.length === 0) {
      throw new Error("Course-root package has no unit children to import")
    }

    const bundles: Ocx10Bundle[] = []

    for (const unitLoaded of unitEntities) {
      const unitSubtree = filterLoadedEntitiesForUnit(
        loadedEntities,
        unitLoaded.entity["@id"]
      )
      const materialIds = collectMaterialIdsForUnit(unitLoaded.entity["@id"], loadedEntities)
      const loadedMaterials = await pkg.loadMaterials(materialIds)

      const prismaBundle = await db.bundle.create({
        data: {
          name: unitBundleName(
            bundleNamePrefix,
            rootEntity.name as string,
            unitLoaded.entity.name as string
          ),
          sitemapUrl: "ocx10://local",
        },
      })

      const ocx10Bundle = new Ocx10Bundle(prismaBundle, [])

      await ocx10Bundle.importLoadedEntities(db, {
        pkg,
        loadedEntities: unitSubtree,
        loadedMaterials,
        rootEntity: unitLoaded.entity,
        courseEntity: rootEntity,
        unitPath: unitLoaded.path,
        transport: packageTransport(source),
      })

      bundles.push(ocx10Bundle)
    }

    return bundles
  }

  if (!isUnitLessonGrouping(rootEntity)) {
    throw new Error("Expected course-root or unit-root OCX 1.0 package")
  }

  const prismaBundle = await db.bundle.create({
    data: {
      name: bundleNamePrefix || rootEntity.name || `OCX 1.0 ${source.origin}`,
      sitemapUrl: "ocx10://local",
    },
  })

  const materialIds = collectMaterialIdsForUnit(rootEntity["@id"], loadedEntities)
  const loadedMaterials = await pkg.loadMaterials(materialIds)

  const ocx10Bundle = new Ocx10Bundle(prismaBundle, [])

  await ocx10Bundle.importLoadedEntities(db, {
    pkg,
    loadedEntities,
    loadedMaterials,
    rootEntity,
    transport: packageTransport(source),
  })

  return [ocx10Bundle]
}

/** @deprecated Use importOcx10Package */
export const importOcx10LocalPackage = importOcx10Package
