import path from "path"
import { pathToFileURL } from "url"

import { describe, expect, it } from "vitest"

import { attachmentFromLegacyFileUrl } from "../legacyFileAttachment"

const packageRoot = "alex/test-data/science-grade-8.ocx"

describe("attachmentFromLegacyFileUrl", () => {
  it("reads a package PDF into AttachmentData", async () => {
    const pdfPath = path.join(packageRoot, "assets/pdf/8.1-Lesson-5-Student-Procedures.pdf")
    const fileUrl = pathToFileURL(pdfPath).href

    const attachment = await attachmentFromLegacyFileUrl(fileUrl, "Lesson 5 Procedures")

    expect(attachment.name).toBe("Lesson 5 Procedures.pdf")
    expect(attachment.blob.size).toBeGreaterThan(0)
  })
})
