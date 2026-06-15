export const OCX10_CURRICULUM_TYPES = [
  "Course",
  "LessonGrouping",
  "Lesson",
  "Activity",
] as const

export type Ocx10CurriculumType = (typeof OCX10_CURRICULUM_TYPES)[number]

export function isCurriculumType(type: string): type is Ocx10CurriculumType {
  return (OCX10_CURRICULUM_TYPES as readonly string[]).includes(type)
}

export function isCurriculumLink(link: { "@type"?: string } | undefined): boolean {
  return !!link?.["@type"] && isCurriculumType(link["@type"])
}

export function isUnitLessonGrouping(entity: { "@type"?: string; groupName?: string }): boolean {
  return entity["@type"] === "LessonGrouping" && entity.groupName === "Unit"
}

export function isLessonSetLessonGrouping(entity: { "@type"?: string; groupName?: string }): boolean {
  return entity["@type"] === "LessonGrouping" && entity.groupName === "Lesson Set"
}
