import { isCurriculumType } from "./curriculumTypes"
import type { Ocx10Package } from "./Ocx10Package"
import { Ocx10CurriculumEntity } from "./types"

export class Ocx10EntityLoader {
  private readonly pkg: Ocx10Package
  private readonly cache = new Map<string, Ocx10CurriculumEntity>()

  constructor(pkg: Ocx10Package) {
    this.pkg = pkg
  }

  async load(id: string): Promise<Ocx10CurriculumEntity> {
    const cached = this.cache.get(id)
    if (cached) {
      return cached
    }

    const relativePath = this.pkg.pathForId(id)
    const raw = await this.pkg.source.readText(relativePath)
    const entity = JSON.parse(raw) as Ocx10CurriculumEntity

    if (entity["@id"] !== id) {
      throw new Error(`Entity @id mismatch in ${relativePath}: expected ${id}, got ${entity["@id"]}`)
    }

    const manifestEntry = this.pkg.curriculumEntries.find((entry) => entry.id === id)
    if (!manifestEntry || !isCurriculumType(manifestEntry.type)) {
      throw new Error(`Id ${id} is not a curriculum entity in manifest`)
    }

    if (entity["@type"] !== manifestEntry.type) {
      throw new Error(
        `Entity @type mismatch for ${id}: manifest says ${manifestEntry.type}, file says ${entity["@type"]}`
      )
    }

    this.cache.set(id, entity)

    return entity
  }

  getCached(id: string): Ocx10CurriculumEntity | undefined {
    return this.cache.get(id)
  }
}
