import { JsonObject } from "type-fest"

import { languages } from "src/constants/languages"

import { ResolvedLmsActivity } from "./lmsActivity"
import {
  isExportableRepresentation,
  selectExportRepresentations,
} from "./resolveMaterialRepresentations"
import { LegacyGoogleClassroomMaterialEntry, ResolvedRepresentation } from "./types"

export interface LegacyGoogleClassroomBlock {
  postTitle: { en: string; es: string }
  postInstructions: { en: string; es: string }
  materials: LegacyGoogleClassroomMaterialEntry[]
}

export function mapInLanguageToVersion(inLanguage: string | undefined): string {
  if (inLanguage?.startsWith("es")) {
    return languages.es
  }

  return languages.en
}

export function toLegacyGoogleClassroomMaterial(
  material: JsonObject,
  rep: ResolvedRepresentation
): LegacyGoogleClassroomMaterialEntry {
  return {
    version: mapInLanguageToVersion(material.inLanguage as string | undefined),
    object: {
      title: (material.name as string | undefined) || "",
      url: rep.legacyUrl!,
      type: rep.legacyMaterialType || "material",
    },
  }
}

function legacyLanguageKey(language: string | undefined): "en" | "es" {
  if (language?.startsWith("es")) {
    return "es"
  }

  return "en"
}

function emptyLocalizedText(): { en: string; es: string } {
  return { en: "", es: "" }
}

function setLocalizedText(
  target: { en: string; es: string },
  language: string | undefined,
  value: string
): void {
  const key = legacyLanguageKey(language)
  target[key] = value

  if (key === "en") {
    target.es = value
  }
}

function composeInstructions(
  materialContent: string | undefined,
  lmsActivity: ResolvedLmsActivity
): string {
  const body = lmsActivity.content.trim()
  const intro = materialContent?.trim()

  if (intro && intro !== body) {
    return `${intro}\n\n${body}`
  }

  return body
}

function findLmsActivityMaterial(
  activity: JsonObject,
  materialNodesById: Map<string, JsonObject>
): { material: JsonObject; lmsActivity: ResolvedLmsActivity } | undefined {
  const hasPart = (activity.hasPart || []) as JsonObject[]

  for (const stub of hasPart) {
    if (stub["@type"] !== "Material") {
      continue
    }

    const material = materialNodesById.get(stub["@id"] as string)

    if (!material?.lmsActivity) {
      continue
    }

    return {
      material,
      lmsActivity: material.lmsActivity as unknown as ResolvedLmsActivity,
    }
  }

  return undefined
}

function collectActivityMaterials(
  activity: JsonObject,
  materialNodesById: Map<string, JsonObject>
): LegacyGoogleClassroomMaterialEntry[] {
  const materials: LegacyGoogleClassroomMaterialEntry[] = []
  const hasPart = (activity.hasPart || []) as JsonObject[]

  for (const stub of hasPart) {
    if (stub["@type"] !== "Material") {
      continue
    }

    const material = materialNodesById.get(stub["@id"] as string)

    if (!material) {
      continue
    }

    const resolvedRepresentations = material.resolvedRepresentations as
      | ResolvedRepresentation[]
      | undefined

    if (!resolvedRepresentations?.some(isExportableRepresentation)) {
      continue
    }

    for (const rep of selectExportRepresentations(resolvedRepresentations)) {
      materials.push(toLegacyGoogleClassroomMaterial(material, rep))
    }
  }

  return materials
}

export function resolveActivityGoogleClassroom(
  activity: JsonObject,
  materialNodesById: Map<string, JsonObject>
): LegacyGoogleClassroomBlock {
  const activityName = (activity.name as string | undefined) || ""
  const match = findLmsActivityMaterial(activity, materialNodesById)
  const materials = collectActivityMaterials(activity, materialNodesById)

  if (!match) {
    return {
      postTitle: { en: activityName, es: activityName },
      postInstructions: emptyLocalizedText(),
      materials,
    }
  }

  const { material, lmsActivity } = match
  const postTitle = emptyLocalizedText()
  const postInstructions = emptyLocalizedText()

  setLocalizedText(postTitle, lmsActivity.language, lmsActivity.title || activityName)
  setLocalizedText(
    postInstructions,
    lmsActivity.language,
    composeInstructions(material.content as string | undefined, lmsActivity)
  )

  return {
    postTitle,
    postInstructions,
    materials,
  }
}
