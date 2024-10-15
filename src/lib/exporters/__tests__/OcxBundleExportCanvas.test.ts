import { describe, it, expect, beforeEach } from "vitest"

import db from "db"

import { Node, BundleExport } from "@prisma/client"

import OcxBundleExportCanvas, { createExportOcxBundleToCanvas } from "../OcxBundleExportCanvas"

import OcxBundle from "src/lib/OcxBundle"
import OcxNode from "src/lib/OcxNode"

import dotenv from 'dotenv';
dotenv.config({ path: '.env.test.local' });

describe('OcxBundleExportCanvas', () => {
  const accessToken = process.env.CANVAS_ACCESS_TOKEN as string;
  const baseUrl = process.env.CANVAS_BASE_URL as string;

  const name = 'Test Course';
  const courseCode = 'test1';
  const sitemapUrl = 'https://raw.githubusercontent.com/illustrativemathematics/static-ocx/main/build/cms_im-PR1334/ed-node-244422/sitemap.xml';

  let bundleExport: BundleExport;
  let ocxBundle: OcxBundle;

  beforeEach(async () => {
    await db.$reset();

    const user = await db.user.create({
      data: {
        email: 'test@test.com',
        name: 'Test User',
      }
    });

    const prismaBundle = await db.bundle.create({
      data: {
        name: name,
        sitemapUrl: sitemapUrl,
      }
    });

    const exportDestination = await db.exportDestination.create({
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
          courseCode
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

    ocxBundle = new OcxBundle(prismaBundle, []);
  });

  describe('exportOcxBundleToCanvas', () => {
    it('should create a course on Canvas and an OcxBundleExport', async () => {
      const ocxBundleExport = await createExportOcxBundleToCanvas(db, bundleExport);

      expect(ocxBundleExport).toBeDefined();
    });
  });

  describe('exportOcxNodeToCanvas', () => {
    let ocxBundleExport: OcxBundleExportCanvas;
    let prismaNode: Node;
    let ocxNode: OcxNode;

    beforeEach(async () => {
      ocxBundleExport = await createExportOcxBundleToCanvas(db, bundleExport);

      prismaNode = await db.node.create({
        data: {
          content: 'Test content',
          metadata: {
            name: 'Test Node',
            alternateName: 'Test Node Alternate Name'
          },
          url: 'https://example.com',
          bundle: {
            connect: {
              id: bundleExport.bundleId
            }
          }
        }
      });

      ocxNode = new OcxNode(prismaNode, ocxBundle);
    });

    it('should create a node on Canvas and an OcxNodeExport', async () => {
      const ocxNodeExport = await ocxBundleExport.exportOcxNodeToAssignment(ocxNode, []);

      expect(ocxNodeExport).toBeDefined();
    });
  });
});
