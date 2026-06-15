import { access, readFile } from "fs/promises"
import path from "path"

import { isCurriculumType, isUnitLessonGrouping } from "./curriculumTypes"
import { Ocx10EntityLoader } from "./Ocx10EntityLoader"
import {
  OCX10_FORMAT,
  Ocx10CurriculumEntity,
  Ocx10LoadedEntity,
  Ocx10Manifest,
  Ocx10ManifestContentEntry,
} from "./types"

export class Ocx10Package {
  readonly packageRoot: string
  readonly manifest: Ocx10Manifest
  readonly curriculumEntries: Ocx10ManifestContentEntry[]
  private readonly pathById: Map<string, string>

  private constructor(
    packageRoot: string,
    manifest: Ocx10Manifest,
    curriculumEntries: Ocx10ManifestContentEntry[],
    pathById: Map<string, string>
  ) {
    this.packageRoot = packageRoot
    this.manifest = manifest
    this.curriculumEntries = curriculumEntries
    this.pathById = pathById
  }

  static async open(packageRoot: string): Promise<Ocx10Package> {
    const absoluteRoot = path.resolve(packageRoot)
    const manifestPath = path.join(absoluteRoot, "manifest.json")

    let manifestRaw: string
    try {
      manifestRaw = await readFile(manifestPath, "utf8")
    } catch {
      throw new Error(`manifest.json not found at ${manifestPath}`)
    }

    const manifest = JSON.parse(manifestRaw) as Ocx10Manifest

    if (manifest.format !== OCX10_FORMAT) {
      throw new Error(`Expected format "${OCX10_FORMAT}", got "${manifest.format}"`)
    }

    if (!manifest.contents?.length) {
      throw new Error("manifest.json contents is empty")
    }

    const curriculumEntries = manifest.contents.filter((entry) => isCurriculumType(entry.type))

    if (!curriculumEntries.length) {
      throw new Error("No curriculum entities found in manifest.contents")
    }

    const pathById = new Map<string, string>()

    for (const entry of manifest.contents) {
      pathById.set(entry.id, entry.path)
    }

    const pkg = new Ocx10Package(absoluteRoot, manifest, curriculumEntries, pathById)

    await pkg.validateCurriculumFiles()

    return pkg
  }

  pathForId(id: string): string {
    const relativePath = this.pathById.get(id)

    if (!relativePath) {
      throw new Error(`No manifest entry for id: ${id}`)
    }

    return relativePath
  }

  absolutePathForId(id: string): string {
    return path.join(this.packageRoot, this.pathForId(id))
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

  private async validateCurriculumFiles(): Promise<void> {
    for (const entry of this.curriculumEntries) {
      const filePath = path.join(this.packageRoot, entry.path)

      try {
        await access(filePath)
      } catch {
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
