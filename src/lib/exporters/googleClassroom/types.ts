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
