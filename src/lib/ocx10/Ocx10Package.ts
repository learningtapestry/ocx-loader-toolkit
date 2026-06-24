import { isCurriculumType, isMaterialType, isUnitLessonGrouping } from "./curriculumTypes"
import { Ocx10EntityLoader } from "./Ocx10EntityLoader"
import { LocalOcx10PackageSource, Ocx10PackageSource } from "./Ocx10PackageSource"
import {
  OCX10_FORMAT,
  Ocx10CurriculumEntity,
  Ocx10LoadedEntity,
  Ocx10LoadedMaterial,
  Ocx10Manifest,
  Ocx10ManifestContentEntry,
  Ocx10Material,
} from "./types"

export class Ocx10Package {
  readonly source: Ocx10PackageSource
  readonly manifest: Ocx10Manifest
  readonly curriculumEntries: Ocx10ManifestContentEntry[]
  readonly materialEntries: Ocx10ManifestContentEntry[]
  private readonly pathById: Map<string, string>

  /** @deprecated Use source.origin. Kept for importMetadata.packageRoot compatibility. */
  get packageRoot(): string {
    return this.source.origin
  }

  private constructor(
    source: Ocx10PackageSource,
    manifest: Ocx10Manifest,
    curriculumEntries: Ocx10ManifestContentEntry[],
    materialEntries: Ocx10ManifestContentEntry[],
    pathById: Map<string, string>
  ) {
    this.source = source
    this.manifest = manifest
    this.curriculumEntries = curriculumEntries
    this.materialEntries = materialEntries
    this.pathById = pathById
  }

  static async openFromSource(source: Ocx10PackageSource): Promise<Ocx10Package> {
    let manifestRaw: string
    try {
      manifestRaw = await source.readText("manifest.json")
    } catch {
      throw new Error(`manifest.json not found for package at ${source.origin}`)
    }

    const manifest = JSON.parse(manifestRaw) as Ocx10Manifest

    if (manifest.format !== OCX10_FORMAT) {
      throw new Error(`Expected format "${OCX10_FORMAT}", got "${manifest.format}"`)
    }

    if (!manifest.contents?.length) {
      throw new Error("manifest.json contents is empty")
    }

    const curriculumEntries = manifest.contents.filter((entry) => isCurriculumType(entry.type))
    const materialEntries = manifest.contents.filter((entry) => isMaterialType(entry.type))

    if (!curriculumEntries.length) {
      throw new Error("No curriculum entities found in manifest.contents")
    }

    const pathById = new Map<string, string>()

    for (const entry of manifest.contents) {
      if (entry.id) {
        pathById.set(entry.id, entry.path)
      }
    }

    for (const entry of materialEntries) {
      if (entry.id) {
        continue
      }

      const raw = await source.readText(entry.path)
      const entity = JSON.parse(raw) as Ocx10Material
      pathById.set(entity["@id"], entry.path)
    }

    const pkg = new Ocx10Package(source, manifest, curriculumEntries, materialEntries, pathById)

    await pkg.validateCurriculumFiles()

    return pkg
  }

  /** Open a package from a local directory (convenience wrapper). */
  static async open(packageRoot: string): Promise<Ocx10Package> {
    return Ocx10Package.openFromSource(new LocalOcx10PackageSource(packageRoot))
  }

  pathForId(id: string): string {
    const relativePath = this.pathById.get(id)

    if (!relativePath) {
      throw new Error(`No manifest entry for id: ${id}`)
    }

    return relativePath
  }

  get rootEntry(): Ocx10ManifestContentEntry {
    const courseEntry = this.curriculumEntries.find((entry) => entry.type === "Course")
    if (courseEntry) {
      return courseEntry
    }

    const unitEntry = this.curriculumEntries.find((entry) => entry.type === "LessonGrouping")
    if (unitEntry) {
      return unitEntry
    }

    return this.curriculumEntries[0]
  }

  createLoader(): Ocx10EntityLoader {
    return new Ocx10EntityLoader(this)
  }

  async loadAllCurriculumEntities(): Promise<Ocx10LoadedEntity[]> {
    const loader = this.createLoader()

    return Promise.all(
      this.curriculumEntries.map(async (entry) => ({
        path: entry.path,
        entity: await loader.load(entry.id),
      }))
    )
  }

  async loadMaterial(id: string): Promise<Ocx10LoadedMaterial> {
    const relativePath = this.pathForId(id)
    const raw = await this.source.readText(relativePath)
    const entity = JSON.parse(raw) as Ocx10Material

    if (entity["@id"] !== id) {
      throw new Error(`Material @id mismatch in ${relativePath}: expected ${id}, got ${entity["@id"]}`)
    }

    const manifestEntry = this.materialEntries.find((entry) => entry.path === relativePath)

    if (!manifestEntry || !isMaterialType(manifestEntry.type)) {
      throw new Error(`Id ${id} is not a Material entity in manifest`)
    }

    if (entity["@type"] !== manifestEntry.type) {
      throw new Error(
        `Material @type mismatch for ${id}: manifest says ${manifestEntry.type}, file says ${entity["@type"]}`
      )
    }

    return {
      path: relativePath,
      entity,
    }
  }

  async loadMaterials(ids: Iterable<string>): Promise<Ocx10LoadedMaterial[]> {
    const uniqueIds = [...new Set(ids)]

    return Promise.all(uniqueIds.map((id) => this.loadMaterial(id)))
  }

  private async validateCurriculumFiles(): Promise<void> {
    for (const entry of this.curriculumEntries) {
      if (!(await this.source.exists(entry.path))) {
        throw new Error(`Curriculum file not found: ${entry.path}`)
      }
    }
  }
}

export function findRootEntity(entities: Ocx10CurriculumEntity[]): Ocx10CurriculumEntity | undefined {
  const course = entities.find((entity) => entity["@type"] === "Course")
  if (course) {
    return course
  }

  return entities.find((entity) => isUnitLessonGrouping(entity))
}
