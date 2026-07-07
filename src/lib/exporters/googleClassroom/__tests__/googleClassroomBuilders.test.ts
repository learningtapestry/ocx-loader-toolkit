import { describe, it, expect } from "vitest"

import { buildAttachments } from "../buildAttachments"
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

describe("buildCoursework", () => {
  it("builds assignment payload with workType and maxPoints", () => {
    const result = buildCoursework(assignmentActivity, lessonParent, "Lesson", "en")

    expect(result?.postType).toBe("assignment")
    expect(result?.payload).toMatchObject({
      title: "Lesson 1: Initial Model",
      workType: "ASSIGNMENT",
      state: "DRAFT",
      maxPoints: 100,
    })
    expect(result?.payload.description).toContain("Initial Diagram doc")
  })

  it("builds material payload without workType", () => {
    const result = buildCoursework(materialActivity, lessonParent, "Lesson", "en")

    expect(result?.postType).toBe("material")
    expect(result?.payload.workType).toBeUndefined()
    expect(result?.payload.maxPoints).toBeUndefined()
    expect(result?.payload.state).toBe("DRAFT")
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
  it("builds youtubeVideo attachment", () => {
    const materials = (youtubeMaterialActivity.metadata.googleClassroom as { materials: [] }).materials
    const attachments = buildAttachments(materials)

    expect(attachments).toEqual([{ youtubeVideo: { id: "ocs6BXQPOgg" } }])
  })

  it("builds link attachment for plain https URLs", () => {
    const materials = (materialActivity.metadata.googleClassroom as { materials: [] }).materials
    const attachments = buildAttachments(materials)

    expect(attachments).toEqual([
      { link: { url: "https://example.com/resource", title: "Example Resource" } },
    ])
  })

  it("skips Google Drive URLs", () => {
    const materials = (driveMaterialActivity.metadata.googleClassroom as { materials: [] }).materials
    const attachments = buildAttachments(materials)

    expect(attachments).toEqual([])
  })

  it("skips materials with null object", () => {
    const attachments = buildAttachments([
      {
        version: "English",
        object: null as unknown as GoogleClassroomMaterial["object"],
      },
    ])

    expect(attachments).toEqual([])
  })

  it("skips s3_url only materials", () => {
    const attachments = buildAttachments([
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
})
