import { Bundle as PrismaBundle, Node as PrismaNode } from "@prisma/client"
import { JsonObject } from "type-fest"

import OcxBundle from "../OcxBundle"

import { isUnitLessonGrouping } from "./curriculumTypes"

export const CANVAS_MAX_NAME_LENGTH = 255

function truncateForCanvas(name: string): string {
  if (name.length <= CANVAS_MAX_NAME_LENGTH) {
    return name
  }

  return `${name.slice(0, CANVAS_MAX_NAME_LENGTH - 1)}…`
}

/**
 * Canvas-safe unit title for OCX 1.0 exports. Uses the driving question (name),
 * not the long unit description stored in about.
 */
export function resolveLegacyExportCourseName(unitMetadata: JsonObject): string {
  const name = (unitMetadata.name as string | undefined)?.trim()
  const alternateName = (unitMetadata.alternateName as string | undefined)?.trim()

  let title: string

  if (alternateName && name) {
    title = `${alternateName}: ${name}`
  } else if (name) {
    title = name
  } else if (alternateName) {
    title = alternateName
  } else {
    title = "Exported unit"
  }

  return truncateForCanvas(title)
}

export function resolveOcx10ExportCourseName(
  bundle: Pick<PrismaBundle, "importMetadata"> & { nodes: PrismaNode[] }
): string | null {
  const importMetadata = bundle.importMetadata as JsonObject | null

  if (importMetadata?.format !== "ocx@1.0.0") {
    return null
  }

  const rootNode = bundle.nodes.find((node) => node.parentId === null)

  if (!rootNode) {
    return null
  }

  const unitMetadata = rootNode.metadata as JsonObject

  if (!isUnitLessonGrouping(unitMetadata)) {
    return null
  }

  const inLanguage = (importMetadata.inLanguage as string) || "en-US"

  return resolveLegacyExportCourseName(convertNodeMetadata(unitMetadata, inLanguage))
}

export function resolveExportCourseName(
  bundle: Pick<PrismaBundle, "name" | "importMetadata"> & { nodes: PrismaNode[] },
  languageSuffix = ""
): string {
  const importMetadata = (bundle.importMetadata ?? {}) as JsonObject

  const title =
    resolveOcx10ExportCourseName(bundle) ||
    (importMetadata.full_course_name as string | undefined) ||
    bundle.name ||
    "Exported bundle"

  return `${title}${languageSuffix}`
}

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
    throw new Error("toLegacyExportView: expected unit-root package")
  }

  const inLanguage = (importMetadata.inLanguage as string) || "en-US"

  const clonedNodes: PrismaNode[] = ocxBundle.ocxNodes.map((ocxNode) => ({
    ...ocxNode.prismaNode,
    metadata: convertNodeMetadata(ocxNode.metadata, inLanguage),
  }))

  return new OcxBundle(ocxBundle.prismaBundle, clonedNodes)
}
