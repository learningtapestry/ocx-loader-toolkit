import path from "path"
import { pathToFileURL } from "url"

import { describe, expect, it } from "vitest"

import { LMS_ACTIVITY_JSON_MIME } from "../lmsActivity"
import { LocalOcx10PackageSource } from "../Ocx10PackageSource"
import {
  resolveRepresentationsForMaterial,
  selectExportRepresentations,
} from "../resolveMaterialRepresentations"
import { Ocx10Material } from "../types"

const packageRoot = "alex/test-data/science-grade-8.ocx"

describe("resolveRepresentationsForMaterial", () => {
  it("resolves package PDF with file:// legacyUrl and assetExists", async () => {
    const source = new LocalOcx10PackageSource(packageRoot)
    const material: Ocx10Material = {
      "@id": "533728b1-ed7d-5116-b2a4-1c1a32d008b9",
      "@type": "Material",
      hasRepresentation: [
        {
          "@id": "9d762a99-a2dd-5d2a-a460-7b9b6bba7be2",
          encodingFormat: "application/pdf",
          accessResource: "assets/pdf/8.1-Lesson-5-Student-Procedures.pdf",
          lmsLoadingGuidance: "Recommended",
        },
      ],
    }

    const result = await resolveRepresentationsForMaterial(source, material)

    expect(result.errors).toHaveLength(0)
    expect(result.resolvedRepresentations).toHaveLength(1)
    expect(result.resolvedRepresentations[0]).toMatchObject({
      accessKind: "packageAsset",
      assetExists: true,
      legacyMaterialType: "material",
      packagePath: "assets/pdf/8.1-Lesson-5-Student-Procedures.pdf",
    })
    expect(result.resolvedRepresentations[0].legacyUrl).toBe(
      pathToFileURL(
        path.join(source.origin, "assets/pdf/8.1-Lesson-5-Student-Procedures.pdf")
      ).href
    )
  })

  it("passes through Google Drive URLs as https legacyUrl", async () => {
    const source = new LocalOcx10PackageSource(packageRoot)
    const driveUrl =
      "https://drive.google.com/open?id=1_H35J0MaY3_4oUdqypMfWG3sKk4DrR0r5G6Cxt7Gq4s"
    const material: Ocx10Material = {
      "@id": "02cd3625-1970-53d3-86ac-3a575982134e",
      "@type": "Material",
      hasRepresentation: [
        {
          encodingFormat: "application/octet-stream",
          accessResource: driveUrl,
          lmsLoadingGuidance: "Required",
        },
      ],
    }

    const result = await resolveRepresentationsForMaterial(source, material)

    expect(result.errors).toHaveLength(0)
    expect(result.resolvedRepresentations[0]).toMatchObject({
      accessKind: "googleDrive",
      legacyUrl: driveUrl,
      legacyMaterialType: "material",
    })
    expect(result.stats.external).toBe(1)
  })

  it("records missingPackageAsset for Required package paths but still resolves", async () => {
    const source = new LocalOcx10PackageSource(packageRoot)
    const material: Ocx10Material = {
      "@id": "missing-material",
      "@type": "Material",
      hasRepresentation: [
        {
          encodingFormat: "application/pdf",
          accessResource: "assets/pdf/does-not-exist.pdf",
          lmsLoadingGuidance: "Required",
        },
      ],
    }

    const result = await resolveRepresentationsForMaterial(source, material)

    expect(result.resolvedRepresentations).toHaveLength(1)
    expect(result.resolvedRepresentations[0].assetExists).toBe(false)
    expect(result.errors).toEqual([
      {
        type: "missingPackageAsset",
        materialId: "missing-material",
        path: "assets/pdf/does-not-exist.pdf",
      },
    ])
    expect(result.stats).toMatchObject({ checked: 1, missing: 1, external: 0 })
  })

  it("classifies YouTube URLs as video", async () => {
    const source = new LocalOcx10PackageSource(packageRoot)
    const youtubeUrl = "https://www.youtube.com/watch?v=J2BUvWRCBGM"
    const material: Ocx10Material = {
      "@id": "2a5b92f5-fd00-5394-ab63-a17a23a09711",
      "@type": "Material",
      hasRepresentation: [
        {
          encodingFormat: "application/octet-stream",
          accessResource: youtubeUrl,
          lmsLoadingGuidance: "Required",
        },
      ],
    }

    const result = await resolveRepresentationsForMaterial(source, material)

    expect(result.resolvedRepresentations[0]).toMatchObject({
      accessKind: "video",
      legacyUrl: youtubeUrl,
      legacyMaterialType: "video",
    })
  })

  it("keeps lmsActivity+json in resolvedRepresentations without validating Optional assets", async () => {
    const source = new LocalOcx10PackageSource(packageRoot)
    const material: Ocx10Material = {
      "@id": "c8547ace-da36-518d-85d4-6b193af990c8",
      "@type": "Material",
      hasRepresentation: [
        {
          encodingFormat: LMS_ACTIVITY_JSON_MIME,
          accessResource: "assets/lms_activity/SCI-G8-SS-LS1-L2-A2.lmsActivity.json",
          lmsLoadingGuidance: "Optional",
        },
      ],
    }

    const result = await resolveRepresentationsForMaterial(source, material)

    expect(result.errors).toHaveLength(0)
    expect(result.stats.checked).toBe(0)
    expect(result.resolvedRepresentations[0]).toMatchObject({
      accessKind: "packageAsset",
      lmsLoadingGuidance: "Optional",
    })
    expect(selectExportRepresentations(result.resolvedRepresentations)).toEqual([])
  })
})

describe("selectExportRepresentations", () => {
  it("prefers Required Google URL over Recommended PDF", () => {
    const selected = selectExportRepresentations([
      {
        id: "pdf",
        encodingFormat: "application/pdf",
        lmsLoadingGuidance: "Recommended",
        accessKind: "packageAsset",
        accessResource: "assets/pdf/foo.pdf",
        legacyUrl: "file:///tmp/foo.pdf",
        legacyMaterialType: "material",
      },
      {
        id: "drive",
        encodingFormat: "application/octet-stream",
        lmsLoadingGuidance: "Required",
        accessKind: "googleDrive",
        accessResource: "https://drive.google.com/open?id=abc",
        legacyUrl: "https://drive.google.com/open?id=abc",
        legacyMaterialType: "material",
      },
    ])

    expect(selected).toHaveLength(1)
    expect(selected[0].id).toBe("drive")
  })
})
