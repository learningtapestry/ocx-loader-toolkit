import path from "path"
import { pathToFileURL } from "url"

import { JsonObject } from "type-fest"

import { LMS_ACTIVITY_JSON_MIME } from "./lmsActivity"
import { Ocx10PackageSource } from "./Ocx10PackageSource"
import {
  AssetValidationSummary,
  Ocx10Material,
  Ocx10MaterialRepresentation,
  ResolvedRepresentation,
  ResolvedRepresentationAccessKind,
} from "./types"

export interface RepresentationResolutionError {
  type: "missingPackageAsset" | "unresolvableAccessResource"
  materialId: string
  path: string
  message?: string
}

export interface RepresentationResolutionResult {
  resolvedRepresentations: ResolvedRepresentation[]
  errors: RepresentationResolutionError[]
  stats: AssetValidationSummary
}

const VALIDATING_GUIDANCE = new Set(["Required", "Recommended"])

function representationId(rep: Ocx10MaterialRepresentation, index: number): string {
  return (rep["@id"] as string | undefined) || (rep.identifier as string | undefined) || `rep-${index}`
}

function normalizeGuidance(guidance: string | undefined): string {
  if (!guidance || guidance === "Unspecified") {
    return "Optional"
  }

  return guidance
}

function isVideoUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com")
}

function classifyAccessResource(
  accessResource: string,
  encodingFormat?: string
): {
  accessKind: ResolvedRepresentationAccessKind
  legacyMaterialType: "material" | "video"
  packagePath?: string
} {
  if (!accessResource.trim()) {
    return { accessKind: "unknown", legacyMaterialType: "material" }
  }

  if (accessResource.startsWith("assets/")) {
    return {
      accessKind: "packageAsset",
      legacyMaterialType: "material",
      packagePath: accessResource,
    }
  }

  const lower = accessResource.toLowerCase()

  if (
    lower.includes("google.com/forms") ||
    lower.includes("docs.google.com/forms") ||
    encodingFormat === "application/vnd.google-apps.form"
  ) {
    return { accessKind: "googleForm", legacyMaterialType: "material" }
  }

  if (
    lower.includes("docs.google.com/presentation") ||
    encodingFormat === "application/vnd.google-apps.presentation"
  ) {
    return { accessKind: "googleSlides", legacyMaterialType: "material" }
  }

  if (
    lower.includes("drive.google.com") ||
    lower.includes("docs.google.com/document") ||
    lower.includes("docs.google.com/spreadsheets") ||
    encodingFormat === "application/vnd.google-apps.document" ||
    encodingFormat === "application/vnd.google-apps.spreadsheet" ||
    (encodingFormat === "application/octet-stream" && lower.includes("google"))
  ) {
    return { accessKind: "googleDrive", legacyMaterialType: "material" }
  }

  if (isVideoUrl(lower)) {
    return { accessKind: "video", legacyMaterialType: "video" }
  }

  if (accessResource.startsWith("http://") || accessResource.startsWith("https://")) {
    return { accessKind: "externalUrl", legacyMaterialType: "material" }
  }

  return { accessKind: "unknown", legacyMaterialType: "material" }
}

function legacyUrlForPackageAsset(source: Ocx10PackageSource, packagePath: string): string {
  return pathToFileURL(path.join(source.origin, packagePath)).href
}

function legacyUrlForRemote(accessResource: string): string {
  return accessResource
}

async function resolveSingleRepresentation(
  source: Ocx10PackageSource,
  materialId: string,
  rep: Ocx10MaterialRepresentation,
  index: number,
  stats: AssetValidationSummary,
  errors: RepresentationResolutionError[]
): Promise<ResolvedRepresentation | undefined> {
  const accessResource = rep.accessResource?.trim() ?? ""
  const encodingFormat = rep.encodingFormat ?? ""
  const lmsLoadingGuidance = normalizeGuidance(rep.lmsLoadingGuidance)

  if (!accessResource) {
    errors.push({
      type: "unresolvableAccessResource",
      materialId,
      path: representationId(rep, index),
      message: "Representation has no accessResource",
    })
    return undefined
  }

  const classification = classifyAccessResource(accessResource, encodingFormat)
  const resolved: ResolvedRepresentation = {
    id: representationId(rep, index),
    encodingFormat,
    lmsLoadingGuidance,
    preferred: rep.preferred,
    inLanguage: rep.inLanguage,
    accessKind: classification.accessKind,
    accessResource,
    packagePath: classification.packagePath,
    legacyMaterialType: classification.legacyMaterialType,
  }

  if (classification.accessKind === "packageAsset" && classification.packagePath) {
    if (VALIDATING_GUIDANCE.has(lmsLoadingGuidance)) {
      stats.checked++
      const exists = await source.exists(classification.packagePath)
      resolved.assetExists = exists

      if (!exists) {
        stats.missing++
        errors.push({
          type: "missingPackageAsset",
          materialId,
          path: classification.packagePath,
        })
      }
    }

    resolved.legacyUrl = legacyUrlForPackageAsset(source, classification.packagePath)
    return resolved
  }

  if (
    classification.accessKind === "googleDrive" ||
    classification.accessKind === "googleForm" ||
    classification.accessKind === "googleSlides" ||
    classification.accessKind === "externalUrl" ||
    classification.accessKind === "video"
  ) {
    stats.external++
    resolved.legacyUrl = legacyUrlForRemote(accessResource)
    return resolved
  }

  errors.push({
    type: "unresolvableAccessResource",
    materialId,
    path: accessResource,
    message: `Unrecognized accessResource pattern (${classification.accessKind})`,
  })

  return resolved
}

export async function resolveRepresentationsForMaterial(
  source: Ocx10PackageSource,
  material: Ocx10Material
): Promise<RepresentationResolutionResult> {
  const materialId = material["@id"]
  const stats: AssetValidationSummary = { checked: 0, missing: 0, external: 0 }
  const errors: RepresentationResolutionError[] = []
  const resolvedRepresentations: ResolvedRepresentation[] = []

  for (const [index, rep] of (material.hasRepresentation ?? []).entries()) {
    const resolved = await resolveSingleRepresentation(
      source,
      materialId,
      rep,
      index,
      stats,
      errors
    )

    if (resolved) {
      resolvedRepresentations.push(resolved)
    }
  }

  return { resolvedRepresentations, errors, stats }
}

export function representationResolutionErrorToBundleError(
  error: RepresentationResolutionError
): JsonObject {
  return {
    type: error.type,
    materialId: error.materialId,
    path: error.path,
    ...(error.message ? { message: error.message } : {}),
  }
}

export function isExportableRepresentation(rep: ResolvedRepresentation): boolean {
  if (rep.encodingFormat === LMS_ACTIVITY_JSON_MIME) {
    return false
  }

  if (!rep.legacyUrl) {
    return false
  }

  return rep.lmsLoadingGuidance === "Required" || rep.lmsLoadingGuidance === "Recommended"
}

function guidanceScore(guidance: string): number {
  return guidance === "Required" ? 2 : 1
}

function formatScore(rep: ResolvedRepresentation): number {
  if (
    rep.accessKind === "googleForm" ||
    rep.accessKind === "googleDrive" ||
    rep.accessKind === "googleSlides"
  ) {
    return 10
  }

  if (rep.accessKind === "packageAsset") {
    if (rep.encodingFormat === "application/pdf") {
      return 8
    }

    return 6
  }

  if (rep.accessKind === "video") {
    return 5
  }

  if (rep.accessKind === "externalUrl") {
    return 4
  }

  return 0
}

export function compareExportRepresentations(a: ResolvedRepresentation, b: ResolvedRepresentation): number {
  const guidanceDiff = guidanceScore(b.lmsLoadingGuidance) - guidanceScore(a.lmsLoadingGuidance)

  if (guidanceDiff !== 0) {
    return guidanceDiff
  }

  return formatScore(b) - formatScore(a)
}

export function selectExportRepresentations(
  resolvedRepresentations: ResolvedRepresentation[] | undefined
): ResolvedRepresentation[] {
  const candidates = (resolvedRepresentations ?? []).filter(isExportableRepresentation)

  if (candidates.length === 0) {
    return []
  }

  const best = [...candidates].sort(compareExportRepresentations)[0]
  return [best]
}
