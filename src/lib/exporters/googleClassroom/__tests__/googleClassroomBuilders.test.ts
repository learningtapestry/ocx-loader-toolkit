import { describe, it, expect, vi } from "vitest"

import {
  isGoogleAppsMime,
  isGoogleDriveOrFormUrl,
  isSubmissionAccessType,
  resolveShareMode,
} from "../attachmentHelpers"
import { buildAttachments, AttachmentResolver, filterMaterialsByLanguage } from "../buildAttachments"
import { buildCoursework, resolveMaxPoints } from "../buildCoursework"
import { GoogleClassroomMaterial, normalizePostType } from "../types"
import { stripHtml } from "../stripHtml"

import {
  assignmentActivity,
  ambiguousPostTypeActivity,
  driveMaterialActivity,
  lessonParent,
  materialActivity,
  summaryPostActivity,
  youtubeMaterialActivity,
  htmlInstructionsActivity,
} from "./fixtures/googleClassroomActivities"

function createMockRepository(
  overrides: Partial<AttachmentResolver> = {},
): AttachmentResolver {
  return {
    copyFromS3: vi.fn().mockResolvedValue({ id: "s3-file-id" }),
    getGoogleDriveUrlFromS3: vi.fn().mockResolvedValue(null),
    resolveDriveAttachment: vi.fn().mockResolvedValue({ id: "drive-file-id" }),
    ...overrides,
  }
}

// TODO(refactor): add Unit-parent title and unknown postType cases from phase plan test matrix
describe("normalizePostType", () => {
  it("returns assignment for exact match", () => {
    expect(normalizePostType("assignment")).toBe("assignment")
    expect(normalizePostType(" Assignment ")).toBe("assignment")
  })

  it("returns material for exact match", () => {
    expect(normalizePostType("material")).toBe("material")
  })

  it("returns summary post for summary post and summarypost", () => {
    expect(normalizePostType("summary post")).toBe("summary post")
    expect(normalizePostType("summarypost")).toBe("summary post")
  })

  it("returns null for ambiguous multi-value postType", () => {
    expect(normalizePostType("assignment, material - choose one, based on blueprint")).toBeNull()
  })

  it("returns null for empty postType", () => {
    expect(normalizePostType("")).toBeNull()
    expect(normalizePostType(undefined)).toBeNull()
  })
})

describe("stripHtml", () => {
  it("strips HTML from instructions", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world")
  })
})

describe("attachmentHelpers", () => {
  it("detects submission access types case-insensitively", () => {
    expect(isSubmissionAccessType("individual-submission")).toBe(true)
    expect(isSubmissionAccessType("Shared-Submission")).toBe(true)
    expect(isSubmissionAccessType("link")).toBe(false)
    expect(isSubmissionAccessType(undefined)).toBe(false)
  })

  it("maps share modes per access type", () => {
    expect(resolveShareMode("individual-submission", false)).toBe("STUDENT_COPY")
    expect(resolveShareMode("shared-submission", false)).toBe("EDIT")
    expect(resolveShareMode("link", false)).toBe("VIEW")
    expect(resolveShareMode("shared-submission", true)).toBe("STUDENT_COPY")
  })

  it("detects Google Apps mime types", () => {
    expect(isGoogleAppsMime("application/vnd.google-apps.document")).toBe(true)
    expect(isGoogleAppsMime("application/pdf")).toBe(false)
  })

  it("classifies Google Drive and Form URLs", () => {
    expect(isGoogleDriveOrFormUrl("https://docs.google.com/document/d/abc/edit")).toBe(true)
    expect(isGoogleDriveOrFormUrl("https://forms.gle/abc123")).toBe(true)
    expect(isGoogleDriveOrFormUrl("https://example.com/file")).toBe(false)
  })
})

describe("buildCoursework", () => {
  it("builds assignment payload with workType and maxPoints", () => {
    const result = buildCoursework(assignmentActivity, lessonParent, "Lesson", "en")

    expect(result?.postType).toBe("assignment")
    expect(result?.payload).toMatchObject({
      title: "Lesson 1: Initial Model",
      workType: "ASSIGNMENT",
      state: "DRAFT",
      maxPoints: 100,
      materials: [],
    })
    expect(result?.payload.description).toContain("Initial Diagram doc")
  })

  it("builds material payload without workType", () => {
    const result = buildCoursework(materialActivity, lessonParent, "Lesson", "en")

    expect(result?.postType).toBe("material")
    expect(result?.payload.workType).toBeUndefined()
    expect(result?.payload.maxPoints).toBeUndefined()
    expect(result?.payload.state).toBe("DRAFT")
    expect(result?.payload.materials).toEqual([])
  })

  it("builds summary post payload like material", () => {
    const result = buildCoursework(summaryPostActivity, lessonParent, "Lesson", "en")

    expect(result?.postType).toBe("summary post")
    expect(result?.payload.workType).toBeUndefined()
  })

  it("returns null for ambiguous postType", () => {
    expect(buildCoursework(ambiguousPostTypeActivity, lessonParent, "Lesson", "en")).toBeNull()
  })

  it("strips HTML in description", () => {
    const result = buildCoursework(htmlInstructionsActivity, lessonParent, "Lesson", "en")

    expect(result?.payload.description).toBe("Draw a diagram")
  })
})

describe("resolveMaxPoints", () => {
  it("uses ocx:points when present", () => {
    expect(resolveMaxPoints({ "ocx:points": "25" })).toBe(25)
  })

  it("uses CompletionGradeFormat fallback", () => {
    expect(
      resolveMaxPoints({
        gradingFormat: { "@type": "oer:CompletionGradeFormat" },
      }),
    ).toBe(0)
  })

  it("uses PointGradeFormat fallback", () => {
    expect(
      resolveMaxPoints({
        gradingFormat: { "@type": "oer:PointGradeFormat" },
      }),
    ).toBe(100)
  })

  it("defaults to 0 when no grading info", () => {
    expect(resolveMaxPoints({})).toBe(0)
  })
})

describe("buildAttachments", () => {
  it("filters materials by export language", async () => {
    const materials = [
      {
        version: "English",
        object: {
          title: "Microwave Oven Manual",
          type: "material" as const,
          url: "https://example.com/en.pdf",
        },
      },
      {
        version: "Spanish",
        object: {
          title: "Manual del horno microondas",
          type: "material" as const,
          url: "https://example.com/es.pdf",
        },
      },
      {
        version: "English, Spanish",
        object: {
          title: "Shared Simulation",
          type: "material" as const,
          url: "https://example.com/sim",
        },
      },
    ]

    const englishAttachments = await buildAttachments(materials, undefined, "en")
    const spanishAttachments = await buildAttachments(materials, undefined, "es")

    expect(englishAttachments).toEqual([
      { link: { url: "https://example.com/en.pdf", title: "Microwave Oven Manual" } },
      { link: { url: "https://example.com/sim", title: "Shared Simulation" } },
    ])
    expect(spanishAttachments).toEqual([
      { link: { url: "https://example.com/es.pdf", title: "Manual del horno microondas" } },
      { link: { url: "https://example.com/sim", title: "Shared Simulation" } },
    ])
  })

  it("filterMaterialsByLanguage mirrors Canvas version filtering", () => {
    const allMaterials = [
      { version: "English", object: { title: "A", type: "material" as const } },
      { version: "Spanish", object: { title: "B", type: "material" as const } },
      { version: "English, Spanish", object: { title: "C", type: "material" as const } },
    ]

    expect(filterMaterialsByLanguage(allMaterials, "en").map((m) => m.object.title)).toEqual([
      "A",
      "C",
    ])
    expect(filterMaterialsByLanguage(allMaterials, "es").map((m) => m.object.title)).toEqual([
      "B",
      "C",
    ])
  })

  it("builds youtubeVideo attachment", async () => {
    const materials = (youtubeMaterialActivity.metadata.googleClassroom as { materials: [] }).materials
    const attachments = await buildAttachments(materials)

    expect(attachments).toEqual([{ youtubeVideo: { id: "ocs6BXQPOgg" } }])
  })

  it("builds link attachment for plain https URLs", async () => {
    const materials = (materialActivity.metadata.googleClassroom as { materials: [] }).materials
    const attachments = await buildAttachments(materials)

    expect(attachments).toEqual([
      { link: { url: "https://example.com/resource", title: "Example Resource" } },
    ])
  })

  it("skips Google Drive URLs without resolver context", async () => {
    const materials = (driveMaterialActivity.metadata.googleClassroom as { materials: [] }).materials
    const attachments = await buildAttachments(materials)

    expect(attachments).toEqual([])
  })

  it("skips materials with null object", async () => {
    const attachments = await buildAttachments([
      {
        version: "English",
        object: null as unknown as GoogleClassroomMaterial["object"],
      },
    ])

    expect(attachments).toEqual([])
  })

  it("skips s3_url only materials without resolver context", async () => {
    const attachments = await buildAttachments([
      {
        version: "English",
        object: {
          title: "S3 file",
          type: "material",
          s3_url: "https://s3.example.com/file.pdf",
        },
      },
    ])

    expect(attachments).toEqual([])
  })

  it("uploads S3 Google Doc with individual-submission as STUDENT_COPY", async () => {
    const repository = createMockRepository()
    const attachments = await buildAttachments(
      [
        {
          version: "English",
          access_type: "individual-submission",
          object: {
            title: "Initial Diagram",
            type: "material",
            s3_url: "https://s3.example.com/doc",
            mime_type: "application/vnd.google-apps.document",
          },
        },
      ],
      { stagingFolderId: "folder-123", repository },
    )

    expect(repository.copyFromS3).toHaveBeenCalledWith(
      "https://s3.example.com/doc",
      "folder-123",
      "application/vnd.google-apps.document",
      "Initial Diagram",
    )
    expect(attachments).toEqual([
      {
        driveFile: {
          driveFile: { id: "s3-file-id" },
          shareMode: "STUDENT_COPY",
        },
      },
    ])
  })

  it("copies Drive URL with shared-submission as EDIT", async () => {
    const repository = createMockRepository()
    const attachments = await buildAttachments(
      [
        {
          version: "English",
          access_type: "shared-submission",
          object: {
            title: "Shared Doc",
            type: "material",
            url: "https://docs.google.com/document/d/abc123/edit",
          },
        },
      ],
      { stagingFolderId: "folder-123", repository },
    )

    expect(repository.resolveDriveAttachment).toHaveBeenCalledWith(
      "https://docs.google.com/document/d/abc123/edit",
      "folder-123",
      "Shared Doc",
    )
    expect(attachments).toEqual([
      {
        driveFile: {
          driveFile: { id: "drive-file-id" },
          shareMode: "EDIT",
        },
      },
    ])
  })

  it("passes Drive URL with link access as link material", async () => {
    const repository = createMockRepository()
    const attachments = await buildAttachments(
      [
        {
          version: "English",
          access_type: "link",
          object: {
            title: "Reference Doc",
            type: "material",
            url: "https://docs.google.com/document/d/abc123/edit",
          },
        },
      ],
      { stagingFolderId: "folder-123", repository },
    )

    expect(repository.resolveDriveAttachment).not.toHaveBeenCalled()
    expect(attachments).toEqual([
      { link: { url: "https://docs.google.com/document/d/abc123/edit", title: "Reference Doc" } },
    ])
  })

  it("attaches form URL with submission access as link", async () => {
    const repository = createMockRepository()
    const attachments = await buildAttachments(
      [
        {
          version: "English",
          access_type: "individual-submission",
          object: {
            title: "Exit Ticket",
            type: "material",
            url: "https://docs.google.com/forms/d/form123/edit",
          },
        },
      ],
      { stagingFolderId: "folder-123", repository },
    )

    expect(repository.resolveDriveAttachment).not.toHaveBeenCalled()
    expect(attachments).toEqual([
      { link: { url: "https://docs.google.com/forms/d/form123/edit", title: "Exit Ticket" } },
    ])
  })

  it("attaches S3 form material as link using Google Drive URL from S3", async () => {
    const formUrl = "https://docs.google.com/forms/d/form123/edit"
    const repository = createMockRepository({
      getGoogleDriveUrlFromS3: vi.fn().mockResolvedValue(formUrl),
    })
    const attachments = await buildAttachments(
      [
        {
          version: "English",
          access_type: "individual-submission",
          object: {
            title: "L1 Exit Ticket",
            type: "material",
            s3_url: "https://s3.example.com/form-data.json",
            mime_type: "application/vnd.google-apps.form",
          },
        },
      ],
      { stagingFolderId: "folder-123", repository },
    )

    expect(repository.copyFromS3).not.toHaveBeenCalled()
    expect(repository.getGoogleDriveUrlFromS3).toHaveBeenCalledWith(
      "https://s3.example.com/form-data.json",
    )
    expect(attachments).toEqual([{ link: { url: formUrl, title: "L1 Exit Ticket" } }])
  })

  it("falls back to S3 link when fetch fails in non-production", async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "development"

    try {
      const repository = createMockRepository({
        copyFromS3: vi.fn().mockRejectedValue(new Error("S3 fetch failed")),
      })

      const attachments = await buildAttachments(
        [
          {
            version: "English",
            access_type: "individual-submission",
            object: {
              title: "Broken S3 Doc",
              type: "material",
              s3_url: "https://s3.example.com/missing",
              mime_type: "application/vnd.google-apps.document",
            },
          },
          {
            version: "English",
            object: {
              title: "Fallback link",
              type: "material",
              url: "https://example.com/fallback",
            },
          },
        ],
        { stagingFolderId: "folder-123", repository },
      )

      expect(attachments).toEqual([
        { link: { url: "https://s3.example.com/missing", title: "Broken S3 Doc" } },
        { link: { url: "https://example.com/fallback", title: "Fallback link" } },
      ])
    } finally {
      process.env.NODE_ENV = originalEnv
    }
  })

  it("skips S3 material when fetch fails in production", async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "production"

    try {
      const repository = createMockRepository({
        copyFromS3: vi.fn().mockRejectedValue(new Error("S3 fetch failed")),
      })

      const attachments = await buildAttachments(
        [
          {
            version: "English",
            access_type: "individual-submission",
            object: {
              title: "Broken S3 Doc",
              type: "material",
              s3_url: "https://s3.example.com/missing",
              mime_type: "application/vnd.google-apps.document",
            },
          },
          {
            version: "English",
            object: {
              title: "Fallback link",
              type: "material",
              url: "https://example.com/fallback",
            },
          },
        ],
        { stagingFolderId: "folder-123", repository },
      )

      expect(attachments).toEqual([
        { link: { url: "https://example.com/fallback", title: "Fallback link" } },
      ])
    } finally {
      process.env.NODE_ENV = originalEnv
    }
  })
})
