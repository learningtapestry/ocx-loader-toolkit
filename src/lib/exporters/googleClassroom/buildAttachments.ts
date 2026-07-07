import { ClassroomMaterial, GoogleClassroomMaterial } from "./types"

function extractYoutubeVideoId(url: string): string | null {
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

function isGoogleDriveOrFormUrl(url: string): boolean {
  return (
    /docs\.google\.com/i.test(url) ||
    /drive\.google\.com/i.test(url) ||
    /google\.com\/forms/i.test(url) ||
    /forms\.gle/i.test(url)
  )
}

function isYoutubeUrl(url: string): boolean {
  return /youtube/i.test(url) || /youtu\.be/i.test(url)
}

export function buildAttachments(materials: GoogleClassroomMaterial[] = []): ClassroomMaterial[] {
  const attachments: ClassroomMaterial[] = []

  for (const material of materials) {
    const object = material.object
    if (!object) {
      continue
    }

    if (object.s3_url) {
      console.debug(`Skipping material with s3_url (Phase 3): ${object.s3_url}`)
      continue
    }

    const url = object.url
    if (!url) {
      continue
    }

    if (isGoogleDriveOrFormUrl(url)) {
      continue
    }

    if (isYoutubeUrl(url)) {
      const id = extractYoutubeVideoId(url)
      if (id) {
        attachments.push({ youtubeVideo: { id } })
      }
      continue
    }

    if (/^https?:\/\//i.test(url)) {
      attachments.push({
        link: {
          url,
          title: object.title || undefined,
        },
      })
    }
  }

  return attachments
}
