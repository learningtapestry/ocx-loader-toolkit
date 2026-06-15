import { Prisma } from "@prisma/client"

import { isCurriculumLink, isCurriculumType } from "./curriculumTypes"
import { Ocx10CurriculumEntity, Ocx10HasPartStub, Ocx10LinkReference } from "./types"

export interface NormalizeHasPartResult {
  hasPart: Ocx10HasPartStub[]
  skippedLinks: SkippedLink[]
}

export interface SkippedLink {
  parentId: string
  linkType: string
  linkId: string
}

function isLinkReference(item: Ocx10LinkReference | Ocx10HasPartStub): item is Ocx10LinkReference {
  return "link" in item && !!item.link
}

function getLinkType(item: Ocx10LinkReference | Ocx10HasPartStub): string | undefined {
  if (isLinkReference(item)) {
    return item.link["@type"]
  }

  return item["@type"]
}

function getLinkId(item: Ocx10LinkReference | Ocx10HasPartStub): string | undefined {
  if (isLinkReference(item)) {
    return item.link["@id"]
  }

  return item["@id"]
}

export function normalizeHasPart(
  parentId: string,
  hasPart: (Ocx10LinkReference | Ocx10HasPartStub)[] | undefined,
  entitiesById: Map<string, Ocx10CurriculumEntity>
): NormalizeHasPartResult {
  const normalized: Ocx10HasPartStub[] = []
  const skippedLinks: SkippedLink[] = []

  for (const item of hasPart ?? []) {
    const linkType = getLinkType(item)
    const linkId = getLinkId(item)

    if (!linkType || !linkId) {
      continue
    }

    if (!isCurriculumType(linkType)) {
      skippedLinks.push({
        parentId,
        linkType,
        linkId,
      })
      continue
    }

    if (isLinkReference(item) && !isCurriculumLink(item.link)) {
      skippedLinks.push({
        parentId,
        linkType,
        linkId,
      })
      continue
    }

    const childEntity = entitiesById.get(linkId)

    normalized.push({
      "@id": linkId,
      "@type": linkType,
      name: childEntity?.name,
    })
  }

  return { hasPart: normalized, skippedLinks }
}

export function skippedLinksToBundleErrors(skippedLinks: SkippedLink[]): Prisma.JsonObject[] {
  return skippedLinks.map((link) => ({
    type: "skippedLink",
    parentId: link.parentId,
    linkType: link.linkType,
    linkId: link.linkId,
  }))
}
