import { describe, it, expect } from "vitest"

import {
  CANVAS_MAX_NAME_LENGTH,
  resolveLegacyExportCourseName,
} from "../toLegacyExportView"

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
