import { describe, expect, it } from "vitest"

import { LMS_ACTIVITY_JSON_MIME, resolveLmsActivityForMaterial } from "../lmsActivity"
import { LocalOcx10PackageSource } from "../Ocx10PackageSource"
import { Ocx10Material } from "../types"

const packageRoot = "alex/test-data/science-grade-8.ocx"

describe("resolveLmsActivityForMaterial", () => {
  it("resolves lmsActivity asset fields from the package", async () => {
    const source = new LocalOcx10PackageSource(packageRoot)
    const material: Ocx10Material = {
      "@id": "c8547ace-da36-518d-85d4-6b193af990c8",
      "@type": "Material",
      hasRepresentation: [
        {
          encodingFormat: LMS_ACTIVITY_JSON_MIME,
          accessResource: "assets/lms_activity/SCI-G8-SS-LS1-L2-A2.lmsActivity.json",
        },
      ],
    }

    const result = await resolveLmsActivityForMaterial(source, material)

    expect(result.error).toBeUndefined()
    expect(result.lmsActivity).toEqual({
      title: "Native American Sky Stories Videos",
      content:
        "Use the attached links to access the two videos of different Native American sky stories explaining why the North Star does not move",
      language: "en-US",
      accessResource: "assets/lms_activity/SCI-G8-SS-LS1-L2-A2.lmsActivity.json",
    })
  })

  it("returns no lmsActivity when the material has no lmsActivity representation", async () => {
    const source = new LocalOcx10PackageSource(packageRoot)
    const material: Ocx10Material = {
      "@id": "example-material",
      "@type": "Material",
      hasRepresentation: [
        {
          encodingFormat: "application/pdf",
          accessResource: "assets/example.pdf",
        },
      ],
    }

    const result = await resolveLmsActivityForMaterial(source, material)

    expect(result).toEqual({})
  })

  it("records a missing asset error", async () => {
    const source = new LocalOcx10PackageSource(packageRoot)
    const material: Ocx10Material = {
      "@id": "missing-material",
      "@type": "Material",
      hasRepresentation: [
        {
          encodingFormat: LMS_ACTIVITY_JSON_MIME,
          accessResource: "assets/lms_activity/does-not-exist.json",
        },
      ],
    }

    const result = await resolveLmsActivityForMaterial(source, material)

    expect(result.lmsActivity).toBeUndefined()
    expect(result.error).toMatchObject({
      type: "missingLmsActivityAsset",
      materialId: "missing-material",
      path: "assets/lms_activity/does-not-exist.json",
    })
  })
})
