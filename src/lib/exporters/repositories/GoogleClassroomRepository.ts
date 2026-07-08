import { ExportDestination } from "@prisma/client"

import ExportDestinationService from "src/lib/ExportDestinationService"

import { extractGoogleFileId, isGoogleFormUrl } from "../googleClassroom/attachmentHelpers"
import { recreateFormInFolder } from "../googleClassroom/recreateForm"
import callGoogleApi, { GoogleApiError, sleep } from "./callGoogleApi"
import callGoogleClassroomApi from "./callGoogleClassroom"

const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3"
const GOOGLE_DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3"

export default class GoogleClassroomRepository {
  exportDestinationService: ExportDestinationService

  constructor(exportDestination: ExportDestination) {
    this.exportDestinationService = new ExportDestinationService(exportDestination)
  }

  private async getToken(): Promise<string> {
    return this.exportDestinationService.getToken()
  }

  async createCourse(name: string, description?: string): Promise<{ id: string; name: string }> {
    const token = await this.getToken()

    const body: Record<string, string> = {
      name,
      ownerId: "me",
      courseState: "PROVISIONED",
    }

    if (description) {
      body.description = description
    }

    return callGoogleClassroomApi(token, "courses", "POST", body)
  }

  async createStagingFolder(courseName: string): Promise<{ id: string }> {
    const token = await this.getToken()

    return callGoogleApi(token, GOOGLE_DRIVE_API_BASE, "files", "POST", {
      name: `Classroom-${courseName}`,
      mimeType: "application/vnd.google-apps.folder",
    })
  }

  async copyDriveFile(
    sourceFileId: string,
    folderId: string,
    title?: string,
  ): Promise<{ id: string }> {
    const token = await this.getToken()

    const body: Record<string, unknown> = {
      parents: [folderId],
    }

    if (title) {
      body.name = title
    }

    return callGoogleApi(
      token,
      GOOGLE_DRIVE_API_BASE,
      `files/${sourceFileId}/copy`,
      "POST",
      body,
    )
  }

  async copyDriveFileFromUrl(
    url: string,
    folderId: string,
    title?: string,
  ): Promise<{ id: string }> {
    const fileId = extractGoogleFileId(url)
    if (!fileId) {
      throw new Error(`Could not extract file ID from URL: ${url}`)
    }

    return this.copyDriveFile(fileId, folderId, title)
  }

  async uploadFileToFolder(
    blob: Blob,
    name: string,
    mimeType: string,
    folderId: string,
  ): Promise<{ id: string }> {
    const token = await this.getToken()

    const metadata = {
      name,
      mimeType,
      parents: [folderId],
    }

    const boundary = "ocx_loader_boundary"
    const body = [
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      JSON.stringify(metadata),
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      "",
    ].join("\r\n")

    const encoder = new TextEncoder()
    const metadataPart = encoder.encode(body)
    const blobPart = encoder.encode("\r\n")
    const closingPart = encoder.encode(`\r\n--${boundary}--\r\n`)
    const blobBytes = new Uint8Array(await blob.arrayBuffer())

    const combined = new Uint8Array(
      metadataPart.length + blobPart.length + blobBytes.length + closingPart.length,
    )
    combined.set(metadataPart, 0)
    combined.set(blobPart, metadataPart.length)
    combined.set(blobBytes, metadataPart.length + blobPart.length)
    combined.set(closingPart, metadataPart.length + blobPart.length + blobBytes.length)

    const response = await fetch(
      `${GOOGLE_DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: combined,
      },
    )

    if (!response.ok) {
      const text = await response.text()
      throw new GoogleApiError("POST", "files?uploadType=multipart", response.status, text)
    }

    return response.json()
  }

  async copyFromS3(
    s3Url: string,
    folderId: string,
    mimeType: string,
    title: string,
  ): Promise<{ id: string }> {
    const response = await fetch(s3Url)
    if (!response.ok) {
      throw new Error(`S3 fetch failed: ${response.status} ${s3Url}`)
    }

    const blob = await response.blob()
    return this.uploadFileToFolder(blob, title, mimeType, folderId)
  }

  async recreateFormInFolder(formSourceUrl: string, folderId: string): Promise<{ id: string }> {
    const token = await this.getToken()
    return recreateFormInFolder(token, formSourceUrl, folderId)
  }

  async resolveDriveAttachment(
    url: string,
    folderId: string,
    title?: string,
  ): Promise<{ id: string }> {
    if (isGoogleFormUrl(url)) {
      return this.recreateFormInFolder(url, folderId)
    }

    return this.copyDriveFileFromUrl(url, folderId, title)
  }

  async createCourseWorkMaterial(
    courseId: string,
    payload: import("../googleClassroom/types").CourseworkPayload,
  ): Promise<{ id: string }> {
    const token = await this.getToken()

    return callGoogleClassroomApi(
      token,
      `courses/${courseId}/courseWorkMaterials`,
      "POST",
      payload,
    )
  }

  async createCourseWork(
    courseId: string,
    payload: import("../googleClassroom/types").CourseworkPayload,
  ): Promise<{ id: string }> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const token = await this.getToken()
        return await callGoogleClassroomApi(token, `courses/${courseId}/courseWork`, "POST", payload)
      } catch (error) {
        const isRetryable =
          error instanceof GoogleApiError && error.status === 502 && attempt < 3

        if (!isRetryable) {
          throw error
        }

        console.warn(
          `Google Classroom createCourseWork failed with 502, retrying (${attempt}/3)...`,
        )
        await sleep(1000 * attempt)
      }
    }

    throw new Error("Google Classroom createCourseWork failed after 3 attempts")
  }
}
