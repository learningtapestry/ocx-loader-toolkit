import { resolver } from "@blitzjs/rpc";
import { ImportBundleSchema } from "../schemas";

import { Prisma, Node as PrismaNode } from ".prisma/client"
import db from "db";

import * as cheerio from 'cheerio';

import parseSitemap from "@/src/app/ocx/loader/utils/parseSitemap"
import absolutizeUrl from "@/src/app/ocx/loader/utils/absolutizeUrl"
import { ParsedSitemap } from "@/src/app/ocx/loader/types"

const METADATA_SELECTOR = 'script[type="application/ld+json"]';

export default resolver.pipe(
  resolver.zod(ImportBundleSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    const bundle = await db.bundle.findFirst({
      where: { id }
    });

    if (!bundle) throw new Error("Bundle not found");

    const sitemap : ParsedSitemap = await parseSitemap(bundle.sitemapUrl);

    await db.node.deleteMany({
      where: { bundleId: id }
    });

    const bundleErrors: Prisma.JsonObject[] = [];

    // load all files in the sitemap and create a node for each
    const nodes = await Promise.all(sitemap.urls.map(async (url, index) => {
      const response = await fetch(absolutizeUrl(bundle.sitemapUrl, url));
      const html = await response.text();

      if (!response.ok) {
        bundleErrors.push({ url, status: response.status });
      } else {
        const $ = cheerio.load(html);
        const content = $('body').first();
        const metadata = JSON.parse($(METADATA_SELECTOR).first().html()!);

        const node = await db.node.create({
          data: {
            url,
            content: content.html() as string,
            metadata,
            bundleId: id,
          }
        });

        return node as PrismaNode;
      }
    }));

    await db.bundle.update({
      where: { id },
      data: {
        errors: bundleErrors
      }
    });

    // assign parent
    for (const node of nodes) {
      if (!node) continue;

      const metadata = node.metadata as Prisma.JsonObject;
      const parts = metadata.hasPart as Prisma.JsonObject[];

      for (const childData of parts) {
        const ocxId = childData['@id'] as string;
        const child = nodes.find(n => (n!.metadata as Prisma.JsonObject)['@id'] === ocxId);
        if (child) {
          await db.node.update({
            where: { id: child.id },
            data: {
              parentId: node.id,
            }
          });
        } else {
          // TODO: the "child" should be an element in the html (content)
        }
      }
    }

    const updatedBundle = await db.bundle.update({
      where: { id },
      data: {
        parsedSitemap: sitemap as unknown as Prisma.JsonObject
      },
      include: {
        nodes: true,
      }
    });

    return updatedBundle;
  }
);
