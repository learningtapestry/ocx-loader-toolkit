import { JsonObject } from "type-fest"

import { ResolvedLmsActivity } from "./lmsActivity"

export interface LegacyGoogleClassroomBlock {
  postTitle: { en: string; es: string }
  postInstructions: { en: string; es: string }
  materials: []
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

export function resolveActivityGoogleClassroom(
  activity: JsonObject,
  materialNodesById: Map<string, JsonObject>
): LegacyGoogleClassroomBlock {
  const activityName = (activity.name as string | undefined) || ""
  const match = findLmsActivityMaterial(activity, materialNodesById)

  if (!match) {
    return {
      postTitle: { en: activityName, es: activityName },
      postInstructions: emptyLocalizedText(),
      materials: [],
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
    materials: [],
  }
}
