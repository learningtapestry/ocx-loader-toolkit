import { DriveShareMode } from "./types"

export const GOOGLE_FORM_MIME = "application/vnd.google-apps.form"

const GOOGLE_APPS_MIME_TYPES = new Set([
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.presentation",
  "application/vnd.google-apps.spreadsheet",
  GOOGLE_FORM_MIME,
])

export function extractYoutubeVideoId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([^&]+)/)
  if (watchMatch) {
    return watchMatch[1]
  }

  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/)
  if (shortMatch) {
    return shortMatch[1]
  }

  const embedMatch = url.match(/\/embed\/([^?&/]+)/)
  if (embedMatch) {
    return embedMatch[1]
  }

  return null
}

export function isGoogleDriveOrFormUrl(url: string): boolean {
  return (
    /docs\.google\.com/i.test(url) ||
    /drive\.google\.com/i.test(url) ||
    /google\.com\/forms/i.test(url) ||
    /forms\.gle/i.test(url)
  )
}

export function isGoogleFormUrl(url: string): boolean {
  return /google\.com\/forms/i.test(url) || /forms\.gle/i.test(url)
}

export function isGoogleFormMime(mimeType: string | undefined): boolean {
  return mimeType === GOOGLE_FORM_MIME
}

export function isYoutubeUrl(url: string): boolean {
  return /youtube/i.test(url) || /youtu\.be/i.test(url)
}

export function isGoogleAppsMime(mimeType: string | undefined): boolean {
  if (!mimeType) {
    return false
  }

  return GOOGLE_APPS_MIME_TYPES.has(mimeType)
}

export function isSubmissionAccessType(accessType: string | undefined): boolean {
  if (!accessType) {
    return false
  }

  const normalized = accessType.trim().toLowerCase()
  return normalized === "individual-submission" || normalized === "shared-submission"
}

export function resolveShareMode(
  accessType: string | undefined,
  isForm: boolean,
): DriveShareMode {
  if (isForm) {
    return "STUDENT_COPY"
  }

  const normalized = (accessType || "").trim().toLowerCase()

  if (normalized === "individual-submission") {
    return "STUDENT_COPY"
  }

  if (normalized === "shared-submission") {
    return "EDIT"
  }

  return "VIEW"
}

export function extractGoogleFileId(url: string): string | null {
  const match = url.match(/\/d\/([^/?]+)|open\?id=([^/?&]+)/)
  if (!match) {
    return null
  }

  return match[1] || match[2] || null
}
