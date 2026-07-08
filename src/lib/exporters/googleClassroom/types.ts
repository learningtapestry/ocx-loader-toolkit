export type GoogleClassroomPostType = "assignment" | "material" | "summary post"

export type GoogleClassroomMaterial = {
  access_type?: string
  version: string
  object: {
    url?: string | null
    s3_url?: string
    mime_type?: string
    title: string
    identifier?: string
    type: "material" | "video"
  }
}

export type GoogleClassroomData = {
  postType: string
  postTitle: { en: string; es: string }
  postInstructions: { en: string; es: string }
  materials: GoogleClassroomMaterial[]
}

export type DriveShareMode = "STUDENT_COPY" | "EDIT" | "VIEW"

export type ClassroomMaterial =
  | { link: { url: string; title?: string } }
  | { youtubeVideo: { id: string } }
  | { driveFile: { driveFile: { id: string }; shareMode: DriveShareMode } }

export type CourseworkPayload = {
  title: string
  description: string
  state: "DRAFT"
  materials: ClassroomMaterial[]
  maxPoints?: number
  workType?: "ASSIGNMENT"
}

export function normalizePostType(raw: string | undefined): GoogleClassroomPostType | null {
  if (!raw) {
    return null
  }

  const normalized = raw.trim().toLowerCase()

  if (!normalized) {
    return null
  }

  if (normalized.includes(",") || normalized.includes("choose one")) {
    return null
  }

  if (normalized === "assignment") {
    return "assignment"
  }

  if (normalized === "material") {
    return "material"
  }

  if (normalized === "summary post" || normalized === "summarypost") {
    return "summary post"
  }

  return null
}
