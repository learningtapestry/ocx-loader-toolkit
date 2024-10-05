import db from "db"

import { describe, it, expect } from "vitest"

import OcxBundleExport from "../OcxBundleExport"

describe ('OcxBundleExport', () => {
  describe ('init', () => {
    it('should initialize exportDestination and canvasRepository from the constructor', async () => {
      const user = await db.user.findFirst();

      const exportDestination = await db.exportDestination.create({
        data: {
          name: 'Canvas',
          type: 'canvas',
          baseUrl: 'http://localhost:3000',
          metadata: {
            accessToken: '1234567890'
          }
        }
      });

      const prismaBundle = await db.bundle.create({
        data: {
          name: 'Test Bundle',
          sitemapUrl: 'http://localhost:3000',
        }
      });

      const prismaBundleExport = await db.bundleExport.create({
        data: {
          name: 'Exporting bundle',
          metadata: {
            courseCode: 'test1',
          },
          bundle: {
            connect: {
              id: prismaBundle.id,
            },
          },
          exportDestination: {
            connect: {
              id: exportDestination.id,
            },
          },
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      const ocxBundleExport = new OcxBundleExport(prismaBundleExport);

      expect(ocxBundleExport.initPromise).toBeDefined();

      await ocxBundleExport.initPromise;

      expect(ocxBundleExport.exportDestination).toBeDefined();
      expect(ocxBundleExport.canvasRepository).toBeDefined();
    });
  });
});
