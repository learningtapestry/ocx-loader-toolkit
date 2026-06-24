import { Bundle as PrismaBundle, Node as PrismaNode } from "@prisma/client"
import { JsonObject } from "type-fest"

import OcxBundle from "../OcxBundle"

import { findUnitRootNode, isUnitLessonGrouping } from "./curriculumTypes"
import { resolveActivityGoogleClassroom } from "./resolveActivityGoogleClassroom"

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

  const rootNode = findUnitRootNode(bundle.nodes)

  if (!rootNode) {
    return null
  }

  const unitMetadata = rootNode.metadata as JsonObject

  const inLanguage = (importMetadata.inLanguage as string) || "en-US"

  return resolveLegacyExportCourseName(convertNodeMetadata(unitMetadata, inLanguage, new Map()))
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

function buildMaterialNodesById(nodes: PrismaNode[]): Map<string, JsonObject> {
  const materialNodesById = new Map<string, JsonObject>()

  for (const node of nodes) {
    const metadata = node.metadata as JsonObject

    if (metadata["@type"] === "Material") {
      materialNodesById.set(metadata["@id"] as string, metadata)
    }
  }

  return materialNodesById
}

function convertNodeMetadata(
  metadata: JsonObject,
  inLanguage: string,
  materialNodesById: Map<string, JsonObject>
): JsonObject {
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
    converted.googleClassroom = resolveActivityGoogleClassroom(
      metadata,
      materialNodesById
    ) as unknown as JsonObject
  }

  return converted
}

export function toLegacyExportView(ocxBundle: OcxBundle): OcxBundle {
  const importMetadata = ocxBundle.prismaBundle.importMetadata as JsonObject | null

  if (importMetadata?.format !== "ocx@1.0.0") {
    throw new Error('toLegacyExportView: expected importMetadata.format "ocx@1.0.0"')
  }

  const inLanguage = (importMetadata.inLanguage as string) || "en-US"
  const materialNodesById = buildMaterialNodesById(ocxBundle.ocxNodes.map((node) => node.prismaNode))

  const clonedNodes: PrismaNode[] = ocxBundle.ocxNodes.map((ocxNode) => ({
    ...ocxNode.prismaNode,
    metadata: convertNodeMetadata(ocxNode.metadata, inLanguage, materialNodesById),
  }))

  const curriculumNodes = clonedNodes.filter(
    (node) => (node.metadata as JsonObject)["@type"] !== "Material"
  )

  const unitRootNode = curriculumNodes.find((node) =>
    isUnitLessonGrouping(node.metadata as JsonObject)
  )

  if (!unitRootNode) {
    throw new Error("toLegacyExportView: expected unit-root package")
  }

  return new OcxBundle(ocxBundle.prismaBundle, curriculumNodes)
}
