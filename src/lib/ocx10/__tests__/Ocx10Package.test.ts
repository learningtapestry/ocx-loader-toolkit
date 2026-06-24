import { describe, expect, it } from "vitest"

import { Ocx10Package } from "../Ocx10Package"
import { LocalOcx10PackageSource } from "../Ocx10PackageSource"

const packageRoot = "alex/test-data/science-grade-8.ocx"

describe("Ocx10Package", () => {
  it("indexes materials whose manifest entry is missing id by @id from the JSON file", async () => {
    const source = new LocalOcx10PackageSource(packageRoot)
    const pkg = await Ocx10Package.openFromSource(source)

    const loaded = await pkg.loadMaterial("ddeb6332-8c90-5137-b6f4-0913036924fb")

    expect(loaded.path).toBe("materials/SCI-G8-CF-bundle-teacher-edition.json")
    expect(loaded.entity["@id"]).toBe("ddeb6332-8c90-5137-b6f4-0913036924fb")
    expect(loaded.entity.name).toContain("Teacher Edition")
  })
})
