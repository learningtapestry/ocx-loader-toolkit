import { describe, it, expect, beforeEach, vi } from "vitest"

import LcmsOpenSciEdLegacyImporter, {OcxUrl, OSEUnitCoordinates} from "../LcmsOpenSciEdLegacyImporter"

import db from "db"
import { Bundle, BundleImportSource } from "@prisma/client"
import { JsonObject } from "type-fest"
import computeHmacSignature from "src/lib/hmac/computeHmacSignature"

describe('LcmsOpenSciEdLegacyImporter', () => {
  describe('OcxUrl', () => {
    it('should parse lcmsUnitId from url', () => {
      const url = 'https://hawk.openscied-lcms.staging.c66.me/openscied/admin/units/117/google-classroom';
      const ocxUrl = new OcxUrl(url);

      expect(ocxUrl.lcmsUnitId).toEqual(117);
    });

    it('should parse lcmsUnitId from preview url', () => {
      const url ='http://localhost:3004/openscied/admin/units/120/google-classroom/preview'
      const ocxUrl = new OcxUrl(url);

      expect(ocxUrl.lcmsUnitId).toEqual(120);
    });

    describe('.findBundleByCoordinates', () => {
      let importSource: BundleImportSource;
      let bundle: Bundle;

      beforeEach(async () => {
        await db.bundleImportSource.deleteMany()
        await db.bundle.deleteMany()

        importSource = await db.bundleImportSource.create({
          data: {
            name: 'importSourceName',
            type: 'lcms-legacy-ose',
            baseUrl: 'https://example.com',
            accessData: {}
          }
        });

        bundle = await db.bundle.create({
          data: {
            name: 'LCMS importSourceName Unit 123',
            sitemapUrl: 'https://example.com/path/to/resource/123?foo=bar',
            importSourceId: importSource.id,
            importMetadata: {
              idOnSource: 123,
              grade: 7,
              subject: 'Science',
              unit: 'cb'
            }
          }
        })
      })

      it('should find a bundle by coordinates', async () => {
        const foundBundle = await LcmsOpenSciEdLegacyImporter.findBundleByCoordinates(importSource, ['grade%207', 'cb', 'en'])

        expect(foundBundle?.prismaBundle.id).toEqual(bundle.id)
      })

      it('should find a bundle if grade only has the number', async () => {
        const foundBundle = await LcmsOpenSciEdLegacyImporter.findBundleByCoordinates(importSource, ['7', 'cb', 'en'])

        expect(foundBundle?.prismaBundle.id).toEqual(bundle.id)
      })

      it('should return null when the bundle does not exist', async () => {
        const foundBundle = await LcmsOpenSciEdLegacyImporter.findBundleByCoordinates(importSource, ['grade%208', 'cb', 'en'])

        expect(foundBundle).toBeNull()
      })
    })
  })

  describe('findOrCreateBundle', () => {
    let importSource: BundleImportSource;

    beforeEach(async () => {
      await db.bundleImportSource.deleteMany()

      importSource = await db.bundleImportSource.create({
        data: {
          name: 'importSourceName',
          type: 'lcms-legacy-ose',
          baseUrl: 'https://example.com',
          accessData: {}
        }
      });
    });

    describe('when the bundle bundle does not exist', () => {
      it('should create a new bundle', async () => {
        const importer = new LcmsOpenSciEdLegacyImporter(importSource)
        const ocxUrl = new OcxUrl('https://example.com/path/to/resource/123?foo=bar')

        const bundle = await importer.findOrCreateBundle(ocxUrl.url)

        expect(bundle.prismaBundle.name).toEqual('LCMS importSourceName Unit 123')
        expect(bundle.prismaBundle.importSourceId).toEqual(importSource.id)
        expect((bundle.prismaBundle.importMetadata as JsonObject).idOnSource).toEqual(123)
      })
    })

    describe('when the bundle bundle already exists', () => {
      let existingBundle: Bundle;

      beforeEach(async () => {
        existingBundle = await db.bundle.create({
          data: {
            name: 'LCMS importSourceName Unit 123',
            sitemapUrl: 'https://example.com/path/to/resource/123?foo=bar',
            importSourceId: importSource.id,
            importMetadata: {
              idOnSource: 123
            }
          }
        })
      })

      it('should return the existing bundle', async () => {
        const importer = new LcmsOpenSciEdLegacyImporter(importSource)
        const ocxUrl = new OcxUrl('https://example.com/path/to/resource/123?foo=bar')

        const bundle = await importer.findOrCreateBundle(ocxUrl.url)

        expect(bundle.prismaBundle.id).toEqual(existingBundle.id)
      })
    })
  })

  describe('getNewOrUpdatedResources', () => {
    let importSource: BundleImportSource
    let mockFetch: ReturnType<typeof vi.fn>

    const resources = [
      { id: 1, title: 'Resource 1' },
      { id: 2, title: 'Resource 2' }
    ]

    beforeEach(async () => {
      await db.bundleImportSource.deleteMany()

      importSource = await db.bundleImportSource.create({
        data: {
          name: 'importSourceName',
          type: 'lcms-legacy-ose',
          baseUrl: 'https://example.com',
          accessData: {
            api_secret_key: 'secret'
          }
        }
      })

      // Mock the global fetch function
      mockFetch = vi.fn()
      global.fetch = mockFetch as any
    })

    it('should return new or updated resources', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(resources)
      })

      const importer = new LcmsOpenSciEdLegacyImporter(importSource)
      const foundResources = await importer.getNewOrUpdatedResources()

      expect(foundResources).toEqual(resources)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/api/resources?link_updated_after=ocx:0',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Api-Timestamp': expect.any(String),
            'X-Api-Signature': expect.stringMatching(/^[a-f0-9]{64}$/),
          })
        })
      )
    })

    it('should throw an error when the fetch request fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      })

      const importer = new LcmsOpenSciEdLegacyImporter(importSource)
      await expect(importer.getNewOrUpdatedResources()).rejects.toThrow('Failed to fetch: Not Found')
    })

    it('should use the correct HMAC signature', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(resources)
      })

      const importer = new LcmsOpenSciEdLegacyImporter(importSource)
      await importer.getNewOrUpdatedResources()

      const fetchCall = mockFetch.mock.calls[0]
      const headers = fetchCall[1].headers
      const timestamp = headers['X-Api-Timestamp']
      const signature = headers['X-Api-Signature']

      const expectedSignature = computeHmacSignature(
        parseInt(timestamp),
        '/api/resources?link_updated_after=ocx:0',
        '',
        'secret'
      )

      expect(signature).toBe(expectedSignature)
    })
  })
})

describe('OSEUnitCoordinates', () => {
  it('should parse the unit name into its coordinates', () => {
    const unitName = 'Science-G7-cb'

    const coordinates = new OSEUnitCoordinates(unitName)

    expect(coordinates.grade).toEqual(7)
    expect(coordinates.subject).toEqual('Science')
    expect(coordinates.unit).toEqual('cb')
    expect(coordinates.subject).toEqual('Science')
  })
})
