import { describe, it, expect, beforeEach } from "vitest";

import { setupRecorder } from "nock-record";
const record = setupRecorder();

import OcxBundle from "../OcxBundle";

import db from "db";
import { Bundle, Prisma } from "@prisma/client"

describe('OcxBundle', () => {
  describe('#importFromSitemap', () => {
    describe('when the sitemap is from IM', () => {
      const name = 'Grade 6 Unit 2';
      const sitemapUrl = 'https://raw.githubusercontent.com/illustrativemathematics/static-ocx/main/build/cms_im-PR1334/ed-node-244422/sitemap.xml';

      let prismaBundle: Bundle;
      let ocxBundle: OcxBundle;

      beforeEach(async () => {
        await db.$reset();

        prismaBundle = await db.bundle.create({
          data: {
            name: name,
            sitemapUrl: sitemapUrl,
          }
        });

        ocxBundle = new OcxBundle(prismaBundle, []);
      });

      it('should load data from a sitemap', async () => {
        const { completeRecording, assertScopesFinished } = await record("OcxBundle#importFromSitemap-IM");

        await ocxBundle.importFromSitemap(db);

        // Complete the recording, allow for Nock to write fixtures
        completeRecording();
        // Optional; assert that all recorded fixtures have been called
        assertScopesFinished();

        expect(ocxBundle.ocxNodes.length).toEqual(117);
        expect(ocxBundle.rootNodes.length).toEqual(35);
        expect((ocxBundle.prismaBundle.errors as Prisma.JsonArray).length).toEqual(0);
      });
    });
  });
});
