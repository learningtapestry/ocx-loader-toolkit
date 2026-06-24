import { describe, it, expect } from "vitest"

import OcxBundle from "../../OcxBundle"
import {
  CANVAS_MAX_NAME_LENGTH,
  resolveLegacyExportCourseName,
  toLegacyExportView,
} from "../toLegacyExportView"
import { isUnitLessonGrouping } from "../curriculumTypes"

describe("resolveLegacyExportCourseName", () => {
  it("uses alternateName and driving question, not about", () => {
    const title = resolveLegacyExportCourseName({
      name: "Why do things sometimes get damaged when they hit each other?",
      alternateName: "Unit 1",
      about: "A".repeat(3000),
    })

    expect(title).toBe(
      "Unit 1: Why do things sometimes get damaged when they hit each other?"
    )
    expect(title.length).toBeLessThan(CANVAS_MAX_NAME_LENGTH)
  })

  it("uses name alone when alternateName is missing", () => {
    expect(
      resolveLegacyExportCourseName({
        name: "How can a sound make something move?",
      })
    ).toBe("How can a sound make something move?")
  })

  it("truncates titles that exceed the Canvas limit", () => {
    const longName = "x".repeat(CANVAS_MAX_NAME_LENGTH + 10)
    const title = resolveLegacyExportCourseName({ name: longName })

    expect(title.length).toBe(CANVAS_MAX_NAME_LENGTH)
    expect(title.endsWith("…")).toBe(true)
  })
})

describe("toLegacyExportView", () => {
  it("drops Material nodes so rootNodes[0] is the unit for legacy export", () => {
    const prismaBundle = {
      id: 1,
      importMetadata: { format: "ocx@1.0.0", inLanguage: "en-US" },
    } as any

    const nodes = [
      {
        id: 1,
        parentId: null,
        bundleId: 1,
        url: "materials/a.json",
        content: "",
        metadata: { "@id": "mat-1", "@type": "Material", name: "Handout" },
      },
      {
        id: 2,
        parentId: null,
        bundleId: 1,
        url: "units/unit.json",
        content: "",
        metadata: {
          "@id": "unit-1",
          "@type": "LessonGrouping",
          groupName: "Unit",
          name: "Unit driving question",
          ordinalName: "Unit 1",
        },
      },
      {
        id: 3,
        parentId: 2,
        bundleId: 1,
        url: "activities/a.json",
        content: "",
        metadata: {
          "@id": "act-1",
          "@type": "Activity",
          name: "Sample activity",
          hasPart: [{ "@id": "mat-1", "@type": "Material" }],
        },
      },
    ] as any[]

    const legacyBundle = toLegacyExportView(new OcxBundle(prismaBundle, nodes))

    expect(legacyBundle.ocxNodes).toHaveLength(2)
    expect(legacyBundle.rootNodes).toHaveLength(1)
    expect(isUnitLessonGrouping(legacyBundle.rootNodes[0].metadata)).toBe(true)
  })
})
