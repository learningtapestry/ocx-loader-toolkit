import {
  extractYoutubeVideoId,
  isGoogleAppsMime,
  isGoogleDriveOrFormUrl,
  isGoogleFormUrl,
  isSubmissionAccessType,
  isYoutubeUrl,
  resolveShareMode,
} from "./attachmentHelpers"
import { ClassroomMaterial, DriveShareMode, GoogleClassroomMaterial } from "./types"

export type AttachmentResolver = {
  copyFromS3: (
    s3Url: string,
    folderId: string,
    mimeType: string,
    title: string,
  ) => Promise<{ id: string }>
  resolveDriveAttachment: (
    url: string,
    folderId: string,
    title?: string,
  ) => Promise<{ id: string }>
}

export type AttachmentResolverContext = {
  stagingFolderId: string
  repository: AttachmentResolver
}

function driveFileMaterial(fileId: string, shareMode: DriveShareMode): ClassroomMaterial {
  return {
    driveFile: {
      driveFile: { id: fileId },
      shareMode,
    },
  }
}

function linkMaterial(url: string, title?: string): ClassroomMaterial {
  return { link: { url, title: title || undefined } }
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

async function resolveS3Material(
  material: GoogleClassroomMaterial,
  ctx: AttachmentResolverContext,
): Promise<ClassroomMaterial | null> {
  const object = material.object
  const accessType = material.access_type

  if (!object.s3_url || !isSubmissionAccessType(accessType)) {
    return null
  }

  if (!isGoogleAppsMime(object.mime_type)) {
    return null
  }

  try {
    const copied = await ctx.repository.copyFromS3(
      object.s3_url,
      ctx.stagingFolderId,
      object.mime_type!,
      object.title,
    )

    const shareMode = resolveShareMode(accessType, object.mime_type === "application/vnd.google-apps.form")
    return driveFileMaterial(copied.id, shareMode)
  } catch (error) {
    if (!isProduction() && object.s3_url) {
      console.warn(
        `Falling back to S3 link in non-production after upload failure: ${object.s3_url}`,
        error,
      )
      return linkMaterial(object.s3_url, object.title)
    }

    console.warn(`Skipping S3 material after fetch failure: ${object.s3_url}`, error)
    return null
  }
}

async function resolveDriveMaterial(
  material: GoogleClassroomMaterial,
  ctx: AttachmentResolverContext,
): Promise<ClassroomMaterial | null> {
  const object = material.object
  const url = object.url
  const accessType = material.access_type

  if (!url || !isGoogleDriveOrFormUrl(url)) {
    return null
  }

  if (!isSubmissionAccessType(accessType)) {
    return { link: { url, title: object.title || undefined } }
  }

  try {
    const copied = await ctx.repository.resolveDriveAttachment(
      url,
      ctx.stagingFolderId,
      object.title,
    )

    const shareMode = resolveShareMode(accessType, isGoogleFormUrl(url))
    return driveFileMaterial(copied.id, shareMode)
  } catch (error) {
    if (!isProduction() && url) {
      console.warn(`Falling back to Drive link in non-production after copy failure: ${url}`, error)
      return linkMaterial(url, object.title)
    }

    console.warn(`Skipping Drive material after copy failure: ${url}`, error)
    return null
  }
}

export async function buildAttachments(
  materials: GoogleClassroomMaterial[] = [],
  ctx?: AttachmentResolverContext,
): Promise<ClassroomMaterial[]> {
  const attachments: ClassroomMaterial[] = []

  for (const material of materials) {
    const object = material.object
    if (!object) {
      continue
    }

    if (ctx) {
      const s3Attachment = await resolveS3Material(material, ctx)
      if (s3Attachment) {
        attachments.push(s3Attachment)
        continue
      }

      const driveAttachment = await resolveDriveMaterial(material, ctx)
      if (driveAttachment) {
        attachments.push(driveAttachment)
        continue
      }
    } else if (object.s3_url) {
      continue
    }

    const url = object.url
    if (!url) {
      continue
    }

    if (!ctx && isGoogleDriveOrFormUrl(url)) {
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
