import db from "db"

import crypto from 'crypto'

import { BundleImportSource } from "@prisma/client"

import OpenSciEdLegacyOcxBundle from "src/lib/LegacyOpenSciEdOcxBundle"
import { JSONObject } from "superjson/src/types"

import ImportBundleJob from "src/app/jobs/importBundleJob"
import computeHmacSignature from "src/lib/hmac/computeHmacSignature"

export class OcxUrl {
  url: string
  parsedUrl: URL

  constructor(url: string) {
    this.url = url
    this.parsedUrl = new URL(url)
  }

  get lcmsUnitId() {
    const pathParts = this.parsedUrl.pathname.split('/')
    const unitsIndex = pathParts.indexOf('units')

    if (unitsIndex !== -1 && unitsIndex + 1 < pathParts.length) {
      return parseInt(pathParts[unitsIndex + 1])
    }

    throw new Error('Invalid URL format: Unable to extract LCMS unit ID')
  }
}

export class OSEUnitCoordinates {
  gradeCode: string
  grade: number
  unit: string
  subject: string

  constructor(unitName: string) {
    // example: Science-G7-cb
    const [subject, gradeCode, unit] = unitName.split('-')

    this.gradeCode = gradeCode
    this.grade = parseInt(gradeCode.slice(1))
    this.unit = unit.toLowerCase()
    this.subject = subject
  }
}

export default class LcmsOpenSciEdLegacyImporter {
  importSource: BundleImportSource

  constructor(importSource: BundleImportSource) {
    this.importSource = importSource
  }

  async importBundle(ocxUrlString: string): Promise<OpenSciEdLegacyOcxBundle> {
    const ocxBundle = await this.findOrCreateBundle(ocxUrlString)

    await ocxBundle.createNodesFromUnitHtml(db, ocxUrlString)

    const rootNode = ocxBundle.rootNodes[0]

    const unitCoordinates = new OSEUnitCoordinates(rootNode.metadata.name as string)

    const updatedBundle = await db.bundle.update({
      where: {
        id: ocxBundle.prismaBundle.id
      },
      data: {
        importMetadata: {
          ...(ocxBundle.prismaBundle.importMetadata as JSONObject),
          grade: unitCoordinates.grade,
          subject: unitCoordinates.subject,
          unit: unitCoordinates.unit,
          course_chapter: rootNode.metadata.alternateName,
          course_about: rootNode.metadata.about,
          full_course_name: rootNode.metadata.alternateName + ': ' + rootNode.metadata.about
        }
      },
      include: {
        nodes: true
      }
    })

    return new OpenSciEdLegacyOcxBundle(updatedBundle, updatedBundle.nodes)
  }

  async findOrCreateBundle(ocxUrlString: string): Promise<OpenSciEdLegacyOcxBundle> {
    const ocxUrl = new OcxUrl(ocxUrlString)

    const lcmsUnitId = ocxUrl.lcmsUnitId

    let bundle = await db.bundle.findFirst({
      where: {
        importSourceId: this.importSource.id,
        importMetadata: {
          path: ['idOnSource'],
          equals: lcmsUnitId
        }
      },
      include: {
        nodes: true
      }
    })

    if (!bundle) {
      bundle = await db.bundle.create({
        data: {
          name: `LCMS ${this.importSource.name} Unit ${lcmsUnitId}`,
          sitemapUrl: ocxUrlString,
          importSourceId: this.importSource.id,
          importMetadata: {
            idOnSource: lcmsUnitId
          }
        },
        include: {
          nodes: true
        }
      })
    }

    return new OpenSciEdLegacyOcxBundle(bundle, bundle.nodes)
  }

  static async findBundleByCoordinates(importSource: BundleImportSource, coordinates: string[]): Promise<OpenSciEdLegacyOcxBundle | null> {
    const [gradeStringToParse, unitString] = coordinates

    // gradeStringToParse example: "grade%207"
    const gradeString = decodeURIComponent(gradeStringToParse)
    const grade = parseInt(gradeString.split(/\s+/).pop()!)

    const unit = unitString.toLowerCase()

    const bundle = await db.bundle.findFirst({
      where: {
        importSourceId: importSource.id,
        importMetadata: {
          path: ['grade'],
            equals: grade
          },
        AND: {
          importMetadata: {
            path: ['unit'],
            equals: unit
          }
        }
      },
      include: {
        nodes: true
      }
    })

    if (!bundle) {
      return null
    }

    return new OpenSciEdLegacyOcxBundle(bundle, bundle.nodes)
  }

  async getNewOrUpdatedResources(): Promise<any> {
    const lastCheckTimestamp = Math.floor((this.importSource.lastCheck || new Date(0)).getTime()/1000)
    const searchParameter = `link_updated_after=ocx:${lastCheckTimestamp}`

    const path = `/api/resources?${searchParameter}`
    const url = `${this.importSource.baseUrl}${path}`
    const timestamp = Math.floor(Date.now() / 1000)
    const body = ''

    const hmacSecret = (this.importSource.accessData as JSONObject).api_secret_key as string;

    const signature = computeHmacSignature(timestamp, path, body, hmacSecret);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Timestamp': timestamp.toString(),
        'X-Api-Signature': signature,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`)
    }

    return await response.json()
  }

  async importAllBundlesWithJobs(): Promise<number> {
    const newOrUpdatedResources = await this.getNewOrUpdatedResources()

    console.log(`LcmsOpenSciEdLegacyImporter: found ${newOrUpdatedResources.length} new or updated resources`)

    for (let resource of newOrUpdatedResources) {
      const ocxUrl = resource.links.ocx?.url

      if (!ocxUrl) {
        console.log(`LcmsOpenSciEdLegacyImporter: skipping resource without OCX URL: ${resource.id}`)
        continue
      }

      await ImportBundleJob.enqueueJob({
        bundleImportSourceId: this.importSource.id,
        ocxUrl
      })

      console.log(`LcmsOpenSciEdLegacyImporter: enqueued job for ${ocxUrl}`)
    }

    await db.bundleImportSource.update({
      where: {
        id: this.importSource.id
      },
      data: {
        lastCheck: new Date()
      }
    })

    return newOrUpdatedResources.length
  }
}
