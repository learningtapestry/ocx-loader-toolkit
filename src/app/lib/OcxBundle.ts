import { Bundle as PrismaBundle, Node as PrismaNode, PrismaClient } from "@prisma/client"

import OcxNode from "./OcxNode"

import * as cheerio from 'cheerio';

import parseSitemap from "@/src/app/ocx/loader/utils/parseSitemap"
import absolutizeUrl from "@/src/app/ocx/loader/utils/absolutizeUrl"
import { ParsedSitemap } from "@/src/app/ocx/loader/types"
import { Prisma } from ".prisma/client"

const METADATA_SELECTOR = 'script[type="application/ld+json"]';

export default class OcxBundle {
  prismaBundle: PrismaBundle;
  ocxNodes: OcxNode[];

  constructor(prismaBundle: PrismaBundle, nodes: PrismaNode[]) {
    this.prismaBundle = prismaBundle;

    this.ocxNodes = nodes.map((node) => new OcxNode(node, this));
  }

  findNodeByOcxId(ocxId: string) : OcxNode {
    return this.ocxNodes.find((node) => node.ocxId === ocxId) as OcxNode;
  }

  findNodeByDbId(dbId: number) : OcxNode {
    return this.ocxNodes.find((node) => node.prismaNode.id === dbId) as OcxNode;
  }

  get rootNodes() {
    return this.ocxNodes.filter((node) => !node.parent);
  }

  async reloadFromDb(db : PrismaClient) {
    const prismaBundle = await db.bundle.findFirst(
      {
        where: { id: this.prismaBundle.id },
        include: { nodes: true }
      });

    this.prismaBundle = prismaBundle!;

    this.ocxNodes = prismaBundle!.nodes.map((node:PrismaNode) => new OcxNode(node, this));
  }

  async createNodesFromSitemap(db: PrismaClient, sitemap: ParsedSitemap | null) {
    if (!sitemap) {
      sitemap = await parseSitemap(this.prismaBundle.sitemapUrl);
    }

    await db.node.deleteMany({
      where: { bundleId: this.prismaBundle.id }
    });

    const bundleErrors: Prisma.JsonObject[] = [];

    // load all files in the sitemap and create a node for each
    const nodes = await Promise.all(sitemap.urls.map(async (url, index) => {
      const response = await fetch(absolutizeUrl(this.prismaBundle.sitemapUrl, url));
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
            bundleId: this.prismaBundle.id,
          }
        });

        return node as PrismaNode;
      }
    }));

    await db.bundle.update({
      where: { id: this.prismaBundle.id },
      data: {
        errors: bundleErrors
      }
    });

    return nodes;
  }

  async assignParentsToNodes(db: PrismaClient, nodes: PrismaNode[]) {
    const errors = this.prismaBundle.errors as Prisma.JsonObject[];

    for (const node of nodes) {
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
          errors.push({ node: (node.metadata as Prisma.JsonObject)['@id'], message: `Child not found: ${ocxId}` });
        }
      }
    }

    if (errors.length > (this.prismaBundle.errors as Prisma.JsonObject[]).length) {
      await db.bundle.update({
        where: { id: this.prismaBundle.id },
        data: {
          errors
        }
      });
    }
  }

  async importFromSitemap(db: PrismaClient, sitemap: ParsedSitemap | null = null) {
    const nodes = (await this.createNodesFromSitemap(db, sitemap))
      .filter(Boolean) as PrismaNode[]

    await this.assignParentsToNodes(db, nodes.filter(Boolean) as PrismaNode[]);

    await this.reloadFromDb(db);
  }
}
