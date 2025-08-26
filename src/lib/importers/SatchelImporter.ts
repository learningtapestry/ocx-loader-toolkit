import db from "db"
import { BundleImportSource, BundleImportStatus, Prisma } from "@prisma/client"
import { JsonObject } from '@prisma/client/runtime/library'
import { readFile} from 'node:fs/promises'
import PathAPI from 'node:path'
import { CaseData, OCXNode } from "../types"

export default class SatchelImporter {

  caseData: CaseData | null = null;

  constructor(private importSource: BundleImportSource) {}

  async importBundle(): Promise<any> {
    // Fetch JSON data from the baseUrl
    // const response = await fetch(this.importSource.baseUrl)
    // if (!response.ok) {
    //   throw new Error(`Failed to fetch JSON from ${this.importSource.baseUrl}: ${response.status} ${response.statusText}`)
    // }

    // Todo: Uncomment when we know from where we get the data
    // const satchelData: CaseData = await response.json()
    const satchelRawData = await readFile('/Users/alex.culea/Documents/Learning Tapestry/Repositories/ocx-loader-toolkit/src/lib/__tests__/fixtures/case/output.json', 'utf-8');
    this.caseData = JSON.parse(satchelRawData.toString());

    const rootOcxNodes = this.findRootOcxNodes(this.caseData)

    if (!rootOcxNodes?.length) {
      throw new Error('Could not find any root OCX nodes. Expecting a node that has no isPartOf association.')
    }

    const results = [] as any[]

    // Import each root as a distinct bundle
    for (const root of rootOcxNodes) {
      const bundle = await this.findOrCreateBundleForRoot(root)

      try {
        await this.updateBundleImportStatus(bundle.id, 'processing')

        // Clear existing nodes and errors for idempotency
        const bundleExports = await db.bundleExport.findMany({ where: { bundleId: bundle.id } });
        for (const bundleExport of bundleExports) {
          await db.nodeExport.deleteMany({ where: { bundleExportId: bundleExport.id } })
        }
        await db.bundleExport.deleteMany({ where: { bundleId: bundle.id } });
        await db.node.deleteMany({ where: { bundleId: bundle.id } })
        await db.bundle.update({ where: { id: bundle.id }, data: { errors: [] } })

        // Create nodes for this root
        await this.createDBOcxNodesRecursively(bundle.id, root, null)

        // Update bundle metadata
        const updatedBundle = await db.bundle.update({
          where: { id: bundle.id },
          data: {
            importMetadata: {
              ...(bundle.importMetadata as JsonObject),
              sourceUrl: this.importSource.baseUrl,
              lastFetched: new Date().toISOString(),
              rootIdentifier: root.identifier,
              rootName: root.name,
              rootType: root["@type"]
            }
          },
          include: { nodes: true }
        })

        await this.updateBundleImportStatus(bundle.id, 'completed')
        results.push(updatedBundle)
      } catch (e) {
        await this.updateBundleImportStatus(bundle.id, 'failed')
        throw e
      }
    }

    return results
  }

  private async findOrCreateBundleForRoot(root: OCXNode) {
    const bundleName = `${this.importSource.name} – ${root.name || root.identifier}`
    const uniqueSitemapUrl = `${this.importSource.baseUrl}#${root.identifier}`

    const existingBundle = await db.bundle.findFirst({
      where: {
        importSourceId: this.importSource.id,
        sitemapUrl: uniqueSitemapUrl
      }
    })

    if (existingBundle) {
      return existingBundle
    }

    return await db.bundle.create({
      data: {
        name: bundleName,
        sitemapUrl: uniqueSitemapUrl,
        importSourceId: this.importSource.id,
        importStatus: 'pending',
        sourceAccessData: this.importSource.accessData as any,
        importMetadata: {
          rootIdentifier: root.identifier,
          rootName: root.name,
          rootType: root["@type"],
          baseUrl: this.importSource.baseUrl
        } as unknown as JsonObject
      }
    })
  }

  private findRootOcxNodes(data: CaseData | null) {
    if (!data) {
      return [];
    }

    const { CFItems } = data;
    const rootOcxNodes: OCXNode[] = [];

    for (const caseItem of CFItems) {
      const ocxNodes = caseItem?.extensions?.ocx?.nodes;
      if (!ocxNodes?.length) {
        continue;
      }

      for (const ocxItem of ocxNodes) {
        if (!ocxItem.isPartOf?.length) {
          rootOcxNodes.push(ocxItem as OCXNode);
        }
      }
    }

    return rootOcxNodes;
  }

  private findOcxNodeById(data: CaseData | null, id: string): OCXNode | null {
    if (!data) {
      return null;
    }

    const { CFItems } = data;

    for (const caseItem of CFItems) {
      const ocxNode = caseItem?.extensions?.ocx?.nodes?.find(node => node?.identifier === id);
      if (ocxNode) {
        return ocxNode;
      }
    }
    
    return null;
  }

  private async createDBOcxNodesRecursively(bundleId: number, root: OCXNode, dbParentId: number | null) {
    if (dbParentId === null) {
      console.log('root', root.identifier);
    } else {
      console.log(`child - parent ID: ${dbParentId} - ${root.identifier}`);
    }

    const dbNode = await db.node.create({ 
      data: {
        bundleId,
        parentId: dbParentId,
        content: this.getOcxNodeContent(root),
        metadata: this.ocx1To08(root),
        url: '',
      }
    });

    const children = root?.hasPart
      ?.map(childId => this.findOcxNodeById(this.caseData, childId?.identifier || ''))
      ?.filter(Boolean);

    if (!children?.length) {
      return
    }

    const promises = children?.map(child => this.createDBOcxNodesRecursively(bundleId, child!, dbNode.id));
    await Promise.all(promises);
  }

  private getOcxNodeContent(node: OCXNode) {
    if (node["@type"] === "Activity") {
      return node?.description || "";
    }

    return ""
  }

  private async updateBundleImportStatus(bundleId: number, importStatus: BundleImportStatus): Promise<void> {
    await db.bundle.update({
      where: { id: bundleId },
      data: { importStatus }
    })
  }

  private ocx1To08(node: OCXNode) {
    const typeMap = {
      "Course": ["Course", "oer:Module"],
      "LessonGrouping": ["Course", "oer:Unit"],
      "Lesson": ["Course", "oer:Lesson"],
      "Activity": ["CreativeWork", "oer:Activity"],
    };

    const isPartOfTypeMap = {
      "Course": "oer:Module",
      "LessonGrouping": "oer:Unit",
      "Lesson": "oer:Lesson",
      "Activity": "oer:Activity",
    };

    const learningResourceTypeMap = {
      "Course": "Module",
      "LessonGrouping": "Unit",
      "Lesson": "Lesson",
      "Activity": "Activity",
    };

    const isPartOf = node.isPartOf?.map(part => ({
      "@id": part.identifier,
      "@type": isPartOfTypeMap[this.findOcxNodeById(this.caseData, part.identifier || '')?.["@type"] as keyof typeof isPartOfTypeMap],
      "name": part.name,
    })) || [];

    const result = {
      "@id": node.identifier,
      "@type": typeMap[node["@type"] as keyof typeof typeMap],
      isPartOf: isPartOf[0],
      hasPart: node.hasPart?.map(part => ({
        "@id": part.identifier,
        "name": part.name,
        "@type": typeMap[this.findOcxNodeById(this.caseData, part.identifier || '')?.["@type"] as keyof typeof typeMap],
      })),
      learningResourceType: learningResourceTypeMap[node["@type"] as keyof typeof learningResourceTypeMap],
      name: node.name,
      alternateName: node.name,
      description: node?.description || "",
      instructions: node?.description || "",
      courseName: undefined as string | undefined,
      googleClassroom: {}
    };

    if (node["@type"] === "LessonGrouping") {
      result.courseName = node.name;
    }
    
    if (node["@type"] === "Activity") {
      result.googleClassroom = {
        postTitle: {
          en: node.name,
        },
        postInstructions: {
          en: node.description
        }
      }
    }

    return result;
  }
} 