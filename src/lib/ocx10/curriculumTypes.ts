export const OCX10_CURRICULUM_TYPES = [
  "Course",
  "LessonGrouping",
  "Lesson",
  "Activity",
] as const

export const OCX10_MATERIAL_TYPE = "Material" as const

export type Ocx10CurriculumType = (typeof OCX10_CURRICULUM_TYPES)[number]

export function isCurriculumType(type: string): type is Ocx10CurriculumType {
  return (OCX10_CURRICULUM_TYPES as readonly string[]).includes(type)
}

export function isMaterialType(type: string): type is typeof OCX10_MATERIAL_TYPE {
  return type === OCX10_MATERIAL_TYPE
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

/** Unit root among flat nodes (materials also have parentId null). */
export function findUnitRootNode<T extends { parentId: number | null; metadata: unknown }>(
  nodes: T[]
): T | undefined {
  return nodes.find(
    (node) => node.parentId === null && isUnitLessonGrouping(node.metadata as { "@type"?: string; groupName?: string })
  )
}
