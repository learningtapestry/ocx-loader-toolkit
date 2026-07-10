import { ExportDestination } from "@prisma/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import GoogleClassroomRepository from "../GoogleClassroomRepository"

function createRepository() {
  const exportDestination = {
    id: "dest-1",
    metadata: {},
  } as ExportDestination

  return new GoogleClassroomRepository(exportDestination)
}

describe("GoogleClassroomRepository", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("getGoogleDriveUrlFromS3", () => {
    it("reads Google Drive URL from S3 metadata headers", async () => {
      const formUrl = "https://docs.google.com/forms/d/abc123/edit"

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({
            "x-amz-meta-google_drive_url": formUrl,
          }),
          text: async () => "{}",
        }),
      )

      const repository = createRepository()
      await expect(repository.getGoogleDriveUrlFromS3("https://s3.example.com/form-data.json")).resolves.toBe(
        formUrl,
      )
    })

    it("falls back to parsing form-data.json body", async () => {
      const formUrl = "https://docs.google.com/forms/d/abc123/edit"

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers(),
          text: async () => JSON.stringify({ google_drive_url: formUrl }),
        }),
      )

      const repository = createRepository()
      await expect(repository.getGoogleDriveUrlFromS3("https://s3.example.com/form-data.json")).resolves.toBe(
        formUrl,
      )
    })
  })

  describe("copyFromS3", () => {
    it("copies Google Docs from S3 Drive metadata instead of uploading", async () => {
      const driveUrl = "https://drive.google.com/open?id=1Q0nIhC9p_Aem14B2ugAScB5uhh-Z-Tyv1ZiYrmXD2FE"

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({
            "content-type": "binary/octet-stream",
            "x-amz-meta-google_drive_url": driveUrl,
            "x-amz-meta-mime_type": "application/vnd.google-apps.document",
          }),
          blob: async () => new Blob(["docx"], { type: "binary/octet-stream" }),
        }),
      )

      const repository = createRepository()
      const copySpy = vi
        .spyOn(repository, "copyDriveFileFromUrl")
        .mockResolvedValue({ id: "copied-doc-id" })
      const uploadSpy = vi.spyOn(repository, "uploadFileToFolder")

      const result = await repository.copyFromS3(
        "https://s3.example.com/handout.docx",
        "folder-123",
        "application/vnd.google-apps.document",
        "Initial Modeling Peer Feedback",
      )

      expect(result).toEqual({ id: "copied-doc-id" })
      expect(copySpy).toHaveBeenCalledWith(
        driveUrl,
        "folder-123",
        "Initial Modeling Peer Feedback",
      )
      expect(uploadSpy).not.toHaveBeenCalled()
    })

    it("uploads binary S3 materials using mime type from S3 metadata header", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          headers: new Headers({
            "content-type": "binary/octet-stream",
            "x-amz-meta-mime_type": "application/pdf",
          }),
          blob: async () => new Blob(["pdf"], { type: "binary/octet-stream" }),
        }),
      )

      const repository = createRepository()
      const uploadSpy = vi
        .spyOn(repository, "uploadFileToFolder")
        .mockResolvedValue({ id: "uploaded-file-id" })

      const result = await repository.copyFromS3(
        "https://s3.example.com/worksheet.pdf",
        "folder-123",
        "application/pdf",
        "Worksheet",
      )

      expect(result).toEqual({ id: "uploaded-file-id" })
      expect(uploadSpy).toHaveBeenCalledWith(
        expect.any(Blob),
        "Worksheet",
        "application/pdf",
        "folder-123",
      )
    })
  })
})
