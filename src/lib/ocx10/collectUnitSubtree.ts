import { isUnitLessonGrouping } from "./curriculumTypes"
import { Ocx10CurriculumEntity, Ocx10HasPartStub, Ocx10LinkReference, Ocx10LoadedEntity } from "./types"

function isLinkReference(item: Ocx10LinkReference | Ocx10HasPartStub): item is Ocx10LinkReference {
  return "link" in item && !!item.link
}

function getLinkId(item: Ocx10LinkReference | Ocx10HasPartStub): string | undefined {
  if (isLinkReference(item)) {
    return item.link["@id"]
  }

  return item["@id"]
}

export function collectDescendantEntityIds(
  rootId: string,
  entitiesById: Map<string, Ocx10CurriculumEntity>
): Set<string> {
  const seen = new Set<string>()

  function walk(entityId: string) {
    if (seen.has(entityId)) {
      return
    }

    seen.add(entityId)

    const entity = entitiesById.get(entityId)
    if (!entity?.hasPart?.length) {
      return
    }

    for (const item of entity.hasPart) {
      const linkId = getLinkId(item)
      if (linkId && entitiesById.has(linkId)) {
        walk(linkId)
      }
    }
  }

  walk(rootId)

  return seen
}

export function getCourseUnitEntities(
  course: Ocx10CurriculumEntity,
  loadedById: Map<string, Ocx10LoadedEntity>
): Ocx10LoadedEntity[] {
  const units: Ocx10LoadedEntity[] = []

  for (const item of course.hasPart ?? []) {
    const linkId = getLinkId(item)
    if (!linkId) {
      continue
    }

    const loaded = loadedById.get(linkId)
    if (loaded && isUnitLessonGrouping(loaded.entity)) {
      units.push(loaded)
    }
  }

  return units
}

export function filterLoadedEntitiesForUnit(
  loadedEntities: Ocx10LoadedEntity[],
  unitEntityId: string
): Ocx10LoadedEntity[] {
  const entitiesById = new Map<string, Ocx10CurriculumEntity>(
    loadedEntities.map((item) => [item.entity["@id"], item.entity])
  )
  const subtreeIds = collectDescendantEntityIds(unitEntityId, entitiesById)

  return loadedEntities.filter((item) => subtreeIds.has(item.entity["@id"]))
}
