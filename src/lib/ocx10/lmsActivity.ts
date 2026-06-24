import { JsonObject } from "type-fest"

import { Ocx10PackageSource } from "./Ocx10PackageSource"
import { Ocx10Material } from "./types"

export const LMS_ACTIVITY_JSON_MIME = "application/vnd.ocx.lmsActivity+json"

export interface ResolvedLmsActivity {
  title: string
  content: string
  language: string
  accessResource: string
}

export interface LmsActivityResolutionError {
  type: "missingLmsActivityAsset" | "invalidLmsActivityAsset"
  materialId: string
  path: string
  message?: string
}

interface LmsActivityAsset {
  title?: unknown
  content?: unknown
  language?: unknown
}

function findLmsActivityAccessResource(material: Ocx10Material): string | undefined {
  for (const representation of material.hasRepresentation ?? []) {
    if (representation.encodingFormat === LMS_ACTIVITY_JSON_MIME && representation.accessResource) {
      return representation.accessResource
    }
  }

  return undefined
}

function parseLmsActivityAsset(
  raw: string,
  accessResource: string
): { lmsActivity?: ResolvedLmsActivity; error?: LmsActivityResolutionError } {
  let parsed: LmsActivityAsset

  try {
    parsed = JSON.parse(raw) as LmsActivityAsset
  } catch (error) {
    return {
      error: {
        type: "invalidLmsActivityAsset",
        materialId: "",
        path: accessResource,
        message: error instanceof Error ? error.message : "Invalid JSON",
      },
    }
  }

  if (
    typeof parsed.title !== "string" ||
    typeof parsed.content !== "string" ||
    typeof parsed.language !== "string"
  ) {
    return {
      error: {
        type: "invalidLmsActivityAsset",
        materialId: "",
        path: accessResource,
        message: "Missing required fields: title, content, language",
      },
    }
  }

  return {
    lmsActivity: {
      title: parsed.title,
      content: parsed.content,
      language: parsed.language,
      accessResource,
    },
  }
}

export async function resolveLmsActivityForMaterial(
  source: Ocx10PackageSource,
  material: Ocx10Material
): Promise<{
  lmsActivity?: ResolvedLmsActivity
  error?: LmsActivityResolutionError
}> {
  const accessResource = findLmsActivityAccessResource(material)

  if (!accessResource) {
    return {}
  }

  const materialId = material["@id"]

  if (!(await source.exists(accessResource))) {
    return {
      error: {
        type: "missingLmsActivityAsset",
        materialId,
        path: accessResource,
      },
    }
  }

  let raw: string

  try {
    raw = await source.readText(accessResource)
  } catch (error) {
    return {
      error: {
        type: "missingLmsActivityAsset",
        materialId,
        path: accessResource,
        message: error instanceof Error ? error.message : "Failed to read asset",
      },
    }
  }

  const result = parseLmsActivityAsset(raw, accessResource)

  if (result.error) {
    return {
      error: {
        ...result.error,
        materialId,
      },
    }
  }

  return { lmsActivity: result.lmsActivity }
}

export function lmsActivityResolutionErrorToBundleError(
  error: LmsActivityResolutionError
): JsonObject {
  return {
    type: error.type,
    materialId: error.materialId,
    path: error.path,
    ...(error.message ? { message: error.message } : {}),
  }
}
