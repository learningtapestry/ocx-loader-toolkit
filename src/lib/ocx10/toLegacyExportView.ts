import { Node as PrismaNode } from "@prisma/client"
import { JsonObject } from "type-fest"

import OcxBundle from "../OcxBundle"

import { isUnitLessonGrouping } from "./curriculumTypes"

function lessonNumberFromOrdinalName(
  ordinalName: string | undefined,
  position: number | undefined,
  name?: string
): string {
  if (ordinalName) {
    const match = ordinalName.match(/(\d+)\s*$/)
    if (match) {
      return match[1]
    }
  }

  if (position !== undefined) {
    return (position + 1).toString()
  }

  if (name) {
    const segments = name.split(/\s+/)
    const last = segments[segments.length - 1]
    if (/^\d+$/.test(last)) {
      return last
    }
  }

  return "1"
}

function convertNodeMetadata(metadata: JsonObject, inLanguage: string): JsonObject {
  const lang = inLanguage.startsWith("es") ? "es" : "en"
  const converted: JsonObject = { ...metadata }

  if (isUnitLessonGrouping(metadata)) {
    if (metadata.description && !converted.about) {
      converted.about = metadata.description
    }

    if (metadata.ordinalName && !converted.alternateName) {
      converted.alternateName = metadata.ordinalName
    }
  } else if (metadata["@type"] === "Lesson") {
    converted.alternateName = lessonNumberFromOrdinalName(
      metadata.ordinalName as string | undefined,
      metadata.position as number | undefined,
      metadata.name as string | undefined
    )
  } else if (metadata["@type"] === "Activity") {
    converted.googleClassroom = {
      postTitle: { en: metadata.name, es: lang === "es" ? metadata.name : "" },
      postInstructions: { en: "", es: "" },
      materials: [],
    }
  }

  return converted
}

export function toLegacyExportView(ocxBundle: OcxBundle): OcxBundle {
  const importMetadata = ocxBundle.prismaBundle.importMetadata as JsonObject | null

  if (importMetadata?.format !== "ocx@1.0.0") {
    throw new Error('toLegacyExportView: expected importMetadata.format "ocx@1.0.0"')
  }

  const rootNodes = ocxBundle.rootNodes

  if (rootNodes.length === 0 || !isUnitLessonGrouping(rootNodes[0].metadata)) {
    throw new Error("toLegacyExportView: course-root packages not supported in Stage 2")
  }

  const inLanguage = (importMetadata.inLanguage as string) || "en-US"

  const clonedNodes: PrismaNode[] = ocxBundle.ocxNodes.map((ocxNode) => ({
    ...ocxNode.prismaNode,
    metadata: convertNodeMetadata(ocxNode.metadata, inLanguage),
  }))

  return new OcxBundle(ocxBundle.prismaBundle, clonedNodes)
}
