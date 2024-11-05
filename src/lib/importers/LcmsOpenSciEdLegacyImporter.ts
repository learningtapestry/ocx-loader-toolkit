import db from "db"

import crypto from 'crypto'

import { BundleImportSource } from "@prisma/client"

import OpenSciEdLegacyOcxBundle from "src/lib/LegacyOpenSciEdOcxBundle"
import { JSONObject } from "superjson/src/types"

import ImportBundleJob from "src/app/jobs/importBundleJob"

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

export default class LcmsOpenSciEdLegacyImporter {
  importSource: BundleImportSource;

  constructor(importSource: BundleImportSource) {
    this.importSource = importSource;
  }

  async importBundle(ocxUrlString: string): Promise<OpenSciEdLegacyOcxBundle> {
    const ocxBundle = await this.findOrCreateBundle(ocxUrlString)

    await ocxBundle.createNodesFromUnitHtml(db, ocxUrlString)

    return ocxBundle
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

  async getNewOrUpdatedResources(): Promise<any> {
    const lastCheckTimestamp = Math.floor((this.importSource.lastCheck || new Date(0)).getTime()/1000)
    const searchParameter = `link_updated_after=ocx:${lastCheckTimestamp}`

    const path = `/api/resources?${searchParameter}`
    const url = `${this.importSource.baseUrl}${path}`
    const timestamp = Math.floor(Date.now() / 1000)
    const body = ''

    const hmacSecret = (this.importSource.accessData as JSONObject).api_secret_key as string;

    const signature = this.computeHmacSignature(timestamp, path, body, hmacSecret);

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

  computeHmacSignature(timestamp: number, path: string, body: string, secretKey: string): string {
    const data = `${timestamp}${path}${body}`;
    return crypto.createHmac('sha256', secretKey)
      .update(data)
      .digest('hex')
  }
}
