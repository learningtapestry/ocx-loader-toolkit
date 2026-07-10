import { GoogleClassroomPostType } from "./types"

// OCX bundle metadata stores googleClassroom.postType as a freeform string, not a typed enum.
// Blueprints may use inconsistent casing/spacing (" Assignment ", "summarypost") or leave the
// author a choice ("assignment, material - choose one, based on blueprint") instead of a single
// value. This function trims and lowercases the raw string, rejects ambiguous multi-value values,
// and maps recognized inputs to the three Google Classroom post types we export: "assignment",
// "material", and "summary post". It returns null when the value is missing, empty, ambiguous,
// or unrecognized. Callers use that result to decide whether an activity is exportable
// (buildCoursework, isExportableActivity), which Classroom API to call (courseWork vs
// courseWorkMaterial), and whether to log an ambiguous-postType warning (GoogleClassroomExporter).
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

// OCX bundle metadata often stores rich text as HTML in postInstructions, description, and about.
// Google Classroom coursework and course description fields expect plain text, so exported posts
// would show raw tags and entities if we passed those strings through unchanged. This function
// removes HTML tags, decodes a few common entities (&nbsp;, &amp;, &lt;, &gt;), collapses
// whitespace, and returns an empty string for missing input. Callers use it when building activity
// descriptions (buildCoursework) and when deriving the course-level description sent to Classroom
// (OcxBundleExportGoogleClassroom).
export function stripHtml(html: string | undefined | null): string {
  if (!html) {
    return ""
  }

  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
}
