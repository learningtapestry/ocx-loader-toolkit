import { Prisma } from "@prisma/client"

import OcxNode from "src/lib/OcxNode"

import {
  CourseworkPayload,
  GoogleClassroomData,
  GoogleClassroomPostType,
} from "./types"
import { normalizePostType, stripHtml } from "./utils"

export type BuiltCoursework = {
  postType: GoogleClassroomPostType
  payload: CourseworkPayload
}

type ParentCourseType = "Lesson" | "Unit"
type Language = "en" | "es"

function getGradingFormatType(gradingFormat: unknown): string | null {
  if (!gradingFormat) {
    return null
  }

  if (Array.isArray(gradingFormat)) {
    const first = gradingFormat[0] as Prisma.JsonObject | undefined
    return (first?.["@type"] as string) || null
  }

  if (typeof gradingFormat === "object") {
    return ((gradingFormat as Prisma.JsonObject)["@type"] as string) || null
  }

  return null
}

export function resolveMaxPoints(activityMetadata: Prisma.JsonObject): number {
  const points = activityMetadata["ocx:points"] ?? activityMetadata.points

  if (points != null && points !== "") {
    const parsed = parseInt(String(points), 10)
    if (!isNaN(parsed)) {
      return parsed
    }
  }

  const gradingFormatType = getGradingFormatType(activityMetadata.gradingFormat)

  if (gradingFormatType === "oer:CompletionGradeFormat") {
    return 0
  }

  if (gradingFormatType === "oer:PointGradeFormat") {
    return 100
  }

  return 0
}

function buildTitle(
  googleClassroomData: GoogleClassroomData,
  activityNode: OcxNode,
  parentNode: OcxNode,
  parentCourseType: ParentCourseType,
  lang: Language,
): string {
  const baseTitle = googleClassroomData.postTitle?.[lang] || activityNode.ocxName
  const activityNumber =
    (activityNode.metadata.alternateName as string) ||
    (parentNode.metadata.alternateName as string) ||
    ""

  if (parentCourseType === "Lesson") {
    return `Lesson ${activityNumber}: ${baseTitle}`
  }

  return `Unit ${activityNumber}: ${baseTitle}`
}

function buildDescription(
  googleClassroomData: GoogleClassroomData,
  activityNode: OcxNode,
  lang: Language,
): string {
  const instructions = googleClassroomData.postInstructions?.[lang]
  if (instructions) {
    return stripHtml(instructions)
  }

  const description =
    (activityNode.metadata.description as string) ||
    (activityNode.metadata.about as string) ||
    ""

  return stripHtml(description)
}

export function buildCoursework(
  activityNode: OcxNode,
  parentNode: OcxNode,
  parentCourseType: ParentCourseType,
  lang: Language = "en",
): BuiltCoursework | null {
  // TODO(refactor): Remove direct reference to Google Classroom
  const googleClassroomData = activityNode.metadata.googleClassroom as GoogleClassroomData | undefined

  if (!googleClassroomData) {
    return null
  }

  const postType = normalizePostType(googleClassroomData.postType)
  if (!postType) {
    return null
  }

  const payload: CourseworkPayload = {
    title: buildTitle(googleClassroomData, activityNode, parentNode, parentCourseType, lang),
    description: buildDescription(googleClassroomData, activityNode, lang),
    state: "DRAFT",
    materials: [],
  }

  if (postType === "assignment") {
    payload.workType = "ASSIGNMENT"
    payload.maxPoints = resolveMaxPoints(activityNode.metadata)
  }

  return { postType, payload }
}

export function isExportableActivity(activityNode: OcxNode): boolean {
  // TODO(refactor): Remove direct reference to Google Classroom
  const googleClassroomData = activityNode.metadata.googleClassroom as GoogleClassroomData | undefined

  if (!googleClassroomData) {
    return false
  }

  return normalizePostType(googleClassroomData.postType) !== null
}

export function countExportableActivities(courseNode: OcxNode): number {
  let count = 0

  for (const unitNode of courseNode.children) {
    for (const lessonNode of unitNode.children) {
      for (const activityNode of lessonNode.children) {
        if (isExportableActivity(activityNode)) {
          count++
        }
      }
    }
  }

  return count
}
