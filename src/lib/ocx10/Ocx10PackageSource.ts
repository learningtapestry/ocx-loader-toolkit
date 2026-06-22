import { access, readFile } from "fs/promises"
import path from "path"

import { BundleImportSource } from "@prisma/client"

/**
 * Reads OCX 1.0 package files by manifest-relative path (e.g. "manifest.json",
 * "curriculum/units/foo.json", "materials/bar.json").
 */
export interface Ocx10PackageSource {
  /** Filesystem path or unit URL identifying where the package comes from. */
  readonly origin: string

  readText(relativePath: string): Promise<string>

  /** Pre-flight check; local sources validate on open, remote sources may no-op. */
  exists(relativePath: string): Promise<boolean>
}

export class LocalOcx10PackageSource implements Ocx10PackageSource {
  readonly origin: string
  private readonly root: string

  constructor(packageRoot: string) {
    this.root = path.resolve(packageRoot)
    this.origin = this.root
  }

  private absolutePath(relativePath: string): string {
    return path.join(this.root, relativePath)
  }

  async readText(relativePath: string): Promise<string> {
    try {
      return await readFile(this.absolutePath(relativePath), "utf8")
    } catch {
      throw new Error(`File not found: ${relativePath}`)
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await access(this.absolutePath(relativePath))
      return true
    } catch {
      return false
    }
  }
}

export type HttpOcx10PackageSourceOptions = {
  /** Per-unit entry URL from LCMS (same role as legacy OSE unit OCX URL). */
  unitUrl: string
  /** BundleImportSource holding baseUrl and accessData.api_secret_key for HMAC auth. */
  importSource: BundleImportSource
}

/**
 * Stub for per-unit HTTP import. Not implemented yet.
 *
 * Expected flow once built:
 * 1. Fetch manifest.json from the unit URL (or a manifest path derived from it).
 * 2. Sign every request with HMAC headers (reuse computeHmacSignature + fetchFromImportSource
 *    from LegacyOpenSciEdOcxBundle / LcmsOpenSciEdLegacyImporter):
 *    - X-Api-Timestamp
 *    - X-Api-Signature over `${timestamp}${pathname}${body}`
 * 3. Resolve manifest-relative paths against importSource.baseUrl + unit path prefix.
 * 4. readText(relativePath) → GET `${baseUrl}${unitPrefix}/${relativePath}` with HMAC headers.
 * 5. exists() → optional HEAD request, or return true and let readText fail on missing files.
 * 6. Wire into LcmsOpenSciEdOcx10Importer + ImportBundleJob (new bundleImportSource.type).
 *
 * Zip-over-HTTP alternative: download zip to a temp dir and use LocalOcx10PackageSource instead.
 */
export class HttpOcx10PackageSource implements Ocx10PackageSource {
  readonly origin: string
  private readonly options: HttpOcx10PackageSourceOptions

  constructor(options: HttpOcx10PackageSourceOptions) {
    this.options = options
    this.origin = options.unitUrl
  }

  async readText(relativePath: string): Promise<string> {
    throw new Error(
      `HttpOcx10PackageSource.readText is not implemented. ` +
        `Unit URL: ${this.options.unitUrl}, path: ${relativePath}. ` +
        `Implement authenticated fetch for manifest-relative paths.`
    )
  }

  async exists(relativePath: string): Promise<boolean> {
    throw new Error(
      `HttpOcx10PackageSource.exists is not implemented. ` +
        `Unit URL: ${this.options.unitUrl}, path: ${relativePath}. ` +
        `Use HEAD or defer validation to readText failures.`
    )
  }
}
