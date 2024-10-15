import { describe, it, expect, beforeEach } from "vitest";

import db from "db"
import { Bundle, BundleExport, ExportDestination, User } from "@prisma/client"

import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config({ path: '.env.test.local' });

import CanvasLegacyOpenSciEdExporter from "../CanvasLegacyOpenSciEdExporter"

import OcxBundle from "src/lib/OcxBundle"

describe('CanvasLegacyOpenSciEdExporter', () => {
  const name = 'OSE LEGACY TEST';
  const sitemapUrl = '';

  const accessToken = process.env.CANVAS_ACCESS_TOKEN as string;
  const baseUrl = process.env.CANVAS_BASE_URL as string;

  let prismaBundle: Bundle;
  let ocxBundle: OcxBundle;

  let user: User;
  let canvasLegacyOpenSciEdExporter: CanvasLegacyOpenSciEdExporter;
  let exportDestination: ExportDestination;
  let bundleExport: BundleExport

  beforeEach(async () => {
    await db.$reset();

    prismaBundle = await db.bundle.create({
      data: {
        name: name,
        sitemapUrl: sitemapUrl,
      }
    });

    ocxBundle = new OcxBundle(prismaBundle, []);

    const zipData = fs.readFileSync(path.join(__dirname, 'fixtures', 'ose_bundle_legacy.ocx.zip'));

    await ocxBundle.importFromZipFile(db, zipData);

    user = await db.user.create({
      data: {
        email: 'test@test.com',
        name: 'Test User',
      }
    });

    exportDestination = await db.exportDestination.create({
      data: {
        name: 'Canvas',
        type: 'canvas',
        baseUrl: baseUrl,
        metadata: {
          accessToken: accessToken
        }
      }
    });

    bundleExport = await db.bundleExport.create({
      data: {
        name: name,
        metadata: {
          courseCode: 'test1'
        },
        exportDestination: {
          connect: {
            id: exportDestination.id
          }
        },
        bundle: {
          connect: {
            id: prismaBundle.id
          }
        },
        user: {
          connect: {
            id: user.id
          }
        }
      }
    });

    canvasLegacyOpenSciEdExporter = new CanvasLegacyOpenSciEdExporter(bundleExport);
  });

  describe('exportAll', () => {
    it('should export all nodes to Canvas', async () => {
      const courseUrl = await canvasLegacyOpenSciEdExporter.exportAll();

      const ocxBundleExport = canvasLegacyOpenSciEdExporter.ocxBundleExportCanvas;

      expect(ocxBundleExport).toBeDefined();

      console.log(`course URL: ${courseUrl}`);

      expect((await db.nodeExport.findMany({
        where: {
          bundleExportId: ocxBundleExport!.prismaBundleExport.id
        }
      })).length).toBeGreaterThan(0);
    }, 60000);
  });
});
