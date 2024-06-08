import { Bundle as PrismaBundle, Node as PrismaNode, PrismaClient } from "@prisma/client"

import OcxNode, { PropertyValidationResult } from "./OcxNode"

import * as cheerio from 'cheerio';
import JSZip from 'jszip';
import slugify from 'slugify';
import _ from 'lodash';

import parseSitemap from "@/src/app/ocx/loader/utils/parseSitemap"
import absolutizeUrl from "@/src/app/ocx/loader/utils/absolutizeUrl"
import { ParsedSitemap } from "@/src/app/ocx/loader/types"
import { Prisma } from ".prisma/client"
import { parseStringPromise } from "xml2js"
import DeepArrayMap from "@/src/app/lib/DeepArrayMap"

const METADATA_SELECTOR = 'script[type="application/ld+json"]';

export default class OcxBundle {
  prismaBundle: PrismaBundle;
  ocxNodes: OcxNode[];

  allTypes: string[] = []; // all @type values (not combined)
  allTypesNodeCount: { [key: string]: number } = {};
  allCombinedTypes: string[] = []; // all combinations of @type values
  allCombinedTypesNodeCount: { [key: string]: number } = {};
  allProperties: string[] = []; // all properties nodes metadata
  allPropertiesNodeCount: { [key: string]: number } = {};
  allPropertiesNotValidNodeCount: { [key: string]: number } = {};
  allPropertiesUnrecognizedNodeCount: { [key: string]: number } = {};
  allScalarPropertiesValues: { [key: string]: string[] } = {};
  allScalarPropertiesValuesValidation = new DeepArrayMap<[string, string], PropertyValidationResult>();
  allObjectPropertiesValues: Record<string, Prisma.JsonObject[]> = {};
  allObjectPropertiesValuesValidation = new DeepArrayMap<[string, Prisma.JsonObject], PropertyValidationResult>();
  allNonStandardProperties = [] as string[];

  propertiesByType: { [key: string]: string[] } = {};
  propertiesNodeCountByType: { [key: string]: { [key: string]: number } } = {};
  propertiesNotValidNodeCountByType: { [key: string]: { [key: string]: number } } = {};
  propertiesUnrecognizedNodeCountByType: { [key: string]: { [key: string]: number } } = {};
  scalarPropertiesValuesByType: { [key: string]: { [key: string]: string[] } } = {};
  scalarPropertiesValuesValidationByType: { [key: string]: DeepArrayMap<[string, string], PropertyValidationResult> }= {};
  objectPropertiesValuesByType: { [key: string]: { [key: string]: Prisma.JsonObject[] } } = {};
  objectPropertiesValuesValidationByType: { [key: string]: DeepArrayMap<[string, Prisma.JsonObject], PropertyValidationResult> } = {};
  nonStandardPropertiesByType: { [key: string]: string[] } = {};

  constructor(prismaBundle: PrismaBundle, nodes: PrismaNode[]) {
    this.prismaBundle = prismaBundle;

    this.ocxNodes = nodes.map((node) => new OcxNode(node, this));

    this.computeAllTypes();
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

  async exportZip() {
    const zip = new JSZip();
    const $ = cheerio.load('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      xmlMode: true
    });

    for (const node of this.ocxNodes) {
      const fileName = `${slugify(node.ocxId)}.ocx.html`;

      zip.file(fileName, node.asHtml);

      $('urlset').append(`<url><loc>${fileName}</loc></url>`);
    }

    zip.file('sitemap.xml', $.xml());

    return zip.generateAsync({ type: 'blob' });
  }

  async reloadFromDb(db : PrismaClient) {
    const prismaBundle = await db.bundle.findFirst(
      {
        where: { id: this.prismaBundle.id },
        include: { nodes: true }
      });

    this.prismaBundle = prismaBundle!;

    this.ocxNodes = prismaBundle!.nodes.map((node:PrismaNode) => new OcxNode(node, this));

    this.computeAllTypes();
  }

  computeAllTypes() {
    this.allTypes = [];
    this.allTypesNodeCount = {};
    this.allCombinedTypes = [];
    this.allCombinedTypesNodeCount = {};
    this.allProperties = [];
    this.allPropertiesNodeCount = {};
    this.allPropertiesNotValidNodeCount = {};
    this.allPropertiesUnrecognizedNodeCount = {};
    this.allScalarPropertiesValues = {};
    this.allScalarPropertiesValuesValidation.clear();
    this.allObjectPropertiesValues = {};
    this.allObjectPropertiesValuesValidation.clear();
    this.allNonStandardProperties = [];

    this.propertiesByType = {};
    this.propertiesNodeCountByType = {};
    this.propertiesNotValidNodeCountByType = {};
    this.propertiesUnrecognizedNodeCountByType = {};

    this.scalarPropertiesValuesByType = {};
    this.scalarPropertiesValuesValidationByType = {};
    this.objectPropertiesValuesByType = {};
    this.objectPropertiesValuesValidationByType = {};
    this.nonStandardPropertiesByType = {};

    for (const node of this.ocxNodes) {
      for (const type of node.ocxTypes as string[]) {
        if (!this.allTypes.includes(type)) {
          this.allTypes.push(type);
        }

        if (!this.allTypesNodeCount[type]) {
          this.allTypesNodeCount[type] = 0;
        }
        this.allTypesNodeCount[type]++;
      }

      for (const property of node.propertiesValidationData.nonStandardProperties) {
        if (!this.allNonStandardProperties.includes(property)) {
          this.allNonStandardProperties.push(property);
        }

        if (!this.nonStandardPropertiesByType[node.ocxCombinedTypes]) {
          this.nonStandardPropertiesByType[node.ocxCombinedTypes] = [];
        }
        if (!this.nonStandardPropertiesByType[node.ocxCombinedTypes].includes(property)) {
          this.nonStandardPropertiesByType[node.ocxCombinedTypes].push(property);
        }
      }

      if (!this.allCombinedTypes.includes(node.ocxCombinedTypes)) {
        this.allCombinedTypes.push(node.ocxCombinedTypes);
      }

      if (!this.allCombinedTypesNodeCount[node.ocxCombinedTypes]) {
        this.allCombinedTypesNodeCount[node.ocxCombinedTypes] = 0;
      }
      this.allCombinedTypesNodeCount[node.ocxCombinedTypes]++;

      // iterate on all properties of the node metadata
      for (const key of Object.keys(node.metadata)) {
        if (!this.allPropertiesNodeCount[key]) {
          this.allPropertiesNodeCount[key] = 0;
        }
        this.allPropertiesNodeCount[key]++;

        // by type
        if (!this.propertiesNodeCountByType[node.ocxCombinedTypes]) {
          this.propertiesNodeCountByType[node.ocxCombinedTypes] = {};
        }
        if (!this.propertiesNodeCountByType[node.ocxCombinedTypes][key]) {
          this.propertiesNodeCountByType[node.ocxCombinedTypes][key] = 0;
        }
        this.propertiesNodeCountByType[node.ocxCombinedTypes][key]++;

        if (key === '@id' || key === '@type') continue;

        if (!this.allProperties.includes(key)) {
          this.allProperties.push(key);
        }

        // by type
        if (!this.propertiesByType[node.ocxCombinedTypes]) {
          this.propertiesByType[node.ocxCombinedTypes] = [];
        }
        if (!this.propertiesByType[node.ocxCombinedTypes].includes(key)) {
          this.propertiesByType[node.ocxCombinedTypes].push(key);
        }

        // collect all values and value validation data
        const validationData = node.propertiesValidationData.propertiesValidationResultsByProperty[key];

        if (!this.allPropertiesNotValidNodeCount[key]) {
          this.allPropertiesNotValidNodeCount[key] = 0;
        }
        if (!this.allPropertiesUnrecognizedNodeCount[key]) {
          this.allPropertiesUnrecognizedNodeCount[key] = 0;
        }
        if (!this.propertiesNotValidNodeCountByType[node.ocxCombinedTypes]) {
          this.propertiesNotValidNodeCountByType[node.ocxCombinedTypes] = {};
        }
        if (!this.propertiesNotValidNodeCountByType[node.ocxCombinedTypes][key]) {
          this.propertiesNotValidNodeCountByType[node.ocxCombinedTypes][key] = 0;
        }if (!this.propertiesUnrecognizedNodeCountByType[node.ocxCombinedTypes]) {
          this.propertiesUnrecognizedNodeCountByType[node.ocxCombinedTypes] = {};
        }
        if (!this.propertiesUnrecognizedNodeCountByType[node.ocxCombinedTypes][key]) {
          this.propertiesUnrecognizedNodeCountByType[node.ocxCombinedTypes][key] = 0;
        }

        if (validationData && !validationData.isValid) {
          if (validationData.isRecognizedProperty) {
            this.allPropertiesNotValidNodeCount[key]++;

            /// by type
            this.propertiesNotValidNodeCountByType[node.ocxCombinedTypes][key]++;

          } else {
            this.allPropertiesUnrecognizedNodeCount[key]++;

            // by type
            this.propertiesUnrecognizedNodeCountByType[node.ocxCombinedTypes][key]++;
          }
        }

        if (typeof node.metadata[key] === 'string') {
          const value = node.metadata[key]! as string;
          if (!this.allScalarPropertiesValues[key]) this.allScalarPropertiesValues[key] = [];
          if (!this.allScalarPropertiesValues[key].includes(value)) {
            this.allScalarPropertiesValues[key].push(value);
          }

          // NB this could overwrite a different result for a different type of node - a value can be valid for one type and invalid for another
          this.allScalarPropertiesValuesValidation.set([key, value], validationData);

          // by type
          if (!this.scalarPropertiesValuesByType[node.ocxCombinedTypes]) {
            this.scalarPropertiesValuesByType[node.ocxCombinedTypes] = {};
          }
          if (!this.scalarPropertiesValuesByType[node.ocxCombinedTypes][key]) {
            this.scalarPropertiesValuesByType[node.ocxCombinedTypes][key] = [];
          }
          if (!this.scalarPropertiesValuesByType[node.ocxCombinedTypes][key].includes(value)) {
            this.scalarPropertiesValuesByType[node.ocxCombinedTypes][key].push(value);
          }

          if (!this.scalarPropertiesValuesValidationByType[node.ocxCombinedTypes]) {
            this.scalarPropertiesValuesValidationByType[node.ocxCombinedTypes] = new DeepArrayMap<[string, string], PropertyValidationResult>();
          }
          this.scalarPropertiesValuesValidationByType[node.ocxCombinedTypes].set([key, value], validationData);
        } else {
          const value = node.metadata[key] as Prisma.JsonObject;
          if (!this.allObjectPropertiesValues[key]) this.allObjectPropertiesValues[key] = [];
          if (!this.allObjectPropertiesValues[key].find((v) => _.isEqual(v, value))) {
            this.allObjectPropertiesValues[key].push(value);
          }

          // NB this could overwrite a different result for a different type of node - a value can be valid for one type and invalid for another
          this.allObjectPropertiesValuesValidation.set([key, value], validationData);

          // by type
          if (!this.objectPropertiesValuesByType[node.ocxCombinedTypes]) {
            this.objectPropertiesValuesByType[node.ocxCombinedTypes] = {};
          }
          if (!this.objectPropertiesValuesByType[node.ocxCombinedTypes][key]) {
            this.objectPropertiesValuesByType[node.ocxCombinedTypes][key] = [];
          }
          if (!this.objectPropertiesValuesByType[node.ocxCombinedTypes][key].find((v) => _.isEqual(v, value))) {
            this.objectPropertiesValuesByType[node.ocxCombinedTypes][key].push(value);
          }

          if (!this.objectPropertiesValuesValidationByType[node.ocxCombinedTypes]) {
            this.objectPropertiesValuesValidationByType[node.ocxCombinedTypes] = new DeepArrayMap<[string, Prisma.JsonObject], PropertyValidationResult>();
          }
          this.objectPropertiesValuesValidationByType[node.ocxCombinedTypes].set([key, value], validationData);
        }
      }
    }
  }

  async createNodesFromSitemap(db: PrismaClient, sitemap: ParsedSitemap | null) {
    if (!sitemap) {
      sitemap = await parseSitemap(this.prismaBundle.sitemapUrl);
    }

    const filesTexts: { [key: string]: string } = {};

    for (const url of sitemap.urls) {
      const absoluteUrl = absolutizeUrl(this.prismaBundle.sitemapUrl, url);
      const response = await fetch(absoluteUrl);
      const html = await response.text();

      filesTexts[url] = html;
    }

    return this.createNodesFromFilesTexts(db, filesTexts);
  }

  async createNodesFromFilesTexts(db: PrismaClient, filesTexts: { [key: string]: string }) {
    await db.node.deleteMany({
      where: { bundleId: this.prismaBundle.id }
    });

    await db.bundle.update({
      where: { id: this.prismaBundle.id },
      data: {
        errors: []
      }
    });
    this.prismaBundle.errors = [];

    const bundleErrors: Prisma.JsonObject[] = [];

    // load all files in the sitemap and create a node for each
    const nodes = await Promise.all(Object.keys(filesTexts).map(async (url, index) => {
      const html = filesTexts[url];

      const $ = cheerio.load(html);
      const content = $('body').first();
      const metadata = JSON.parse($(METADATA_SELECTOR).first().html()!);

      const node: PrismaNode = await db.node.create({
        data: {
          url,
          content: content.html() as string,
          metadata,
          bundleId: this.prismaBundle.id,
        }
      });

      return node;
    }));

    const ocxIds: string[] = [];

    const updatedNodes = await Promise.all(nodes.map(async (node) => {
      const metadata = node.metadata as Prisma.JsonObject;

      if (ocxIds.includes(metadata['@id'] as string)) {
        const newOcxId = `${metadata['@id']}-${node.id}`;

        bundleErrors.push({ nodeId: node.id, ocxId: (node.metadata as Prisma.JsonObject)['@id'], message: 'Duplicate @id' });

        ocxIds.push(newOcxId);

        return(await db.node.update({
          where: { id: node.id },
          data: {
            metadata: {
              ...metadata,
              '@id': newOcxId
            }
          }
        }));
      } else {
        ocxIds.push(metadata['@id'] as string);

        return node;
      }
    }));

    await this.appendErrors(db, bundleErrors);

    return updatedNodes;
  }

  async appendErrors(db: PrismaClient, errors: Prisma.JsonObject[]) {
    const updatedErrors = ((this.prismaBundle.errors || []) as Prisma.JsonObject[]).concat(errors);

    await db.bundle.update({
      where: { id: this.prismaBundle.id },
      data: {
        errors: updatedErrors
      }
    });

    this.prismaBundle.errors = updatedErrors;
  }

  async splitPartNodes(db: PrismaClient, nodes: PrismaNode[]) {
    // for each hasPart, check if there is an html element with the same id
    // if there is, split the content and create a new node
    // a node metadata in hasPart could have hasPart too, so we need to also iterate on the new nodes

    const nodesDup = nodes.slice();
    const updatedNodes: PrismaNode[] = [];

    const errors = [] as Prisma.JsonObject[];

    for (let i = 0; i < nodesDup.length; i++) {
      const node = nodesDup[i];
      const metadata = node.metadata as Prisma.JsonObject;
      const parts = (metadata.hasPart || []) as Prisma.JsonObject[];
      const updatedParts = [] as Prisma.JsonObject[];
      const parsedContent = cheerio.load(node.content as string);

      for (const partMetadata of parts) {
        const ocxId = partMetadata['@id'] as string;

        if (!ocxId.startsWith('#')) {
          updatedParts.push(partMetadata);

          continue;
        }

        const existingPart = nodesDup.find(n => (n.metadata as Prisma.JsonObject)['@id'] === ocxId);

        const htmlId = ocxId.substring(1);

        const elementForPart = parsedContent(`[id="${htmlId}"]`);

        if (elementForPart.length === 0) {
          if (!existingPart) {
            errors.push({ node: (node.metadata as Prisma.JsonObject)['@id'], message: `Part/Element not found: ${ocxId}` });
          } else {
            const existingPartOcxNode = new OcxNode(existingPart, this);

            updatedParts.push(existingPartOcxNode.asPartData as unknown as Prisma.JsonObject);
          }

          continue;
        }

        if (elementForPart.length > 1) {
          errors.push({ node: (node.metadata as Prisma.JsonObject)['@id'], message: `Multiple elements with the same html id: ${htmlId}` });
        }

        if (existingPart) {
          const renamedId = `${ocxId}-${i}`;

          errors.push({ node: (node.metadata as Prisma.JsonObject)['@id'], message: `Multiple elements with the same @id: ${ocxId}. Renamed to ${renamedId}`});

          partMetadata['@id'] = renamedId;
          elementForPart.attr('id', renamedId.slice(1));
        }

        const partCheerio = cheerio.load(parsedContent.html()!);
        partCheerio('body').html(elementForPart.toString()!);
        elementForPart.remove();

        const partNode = await db.node.create({
          data: {
            url: node.url,
            content: partCheerio.html() as string,
            metadata: {
              hasPart: [],
              ...partMetadata
            },
            bundleId: node.bundleId,
            parentId: node.id
          }
        });

        const partMetadataReduced = {
          '@id': partMetadata['@id'],
          '@type': partMetadata['@type'],
          name: partMetadata.name,
          url: partMetadata.url
        };
        updatedParts.push(partMetadataReduced);

        nodesDup.push(partNode);
      }

      // update the original node
      const updatedNode = await db.node.update({
        where: { id: node.id },
        data: {
          content: parsedContent.html(),
          metadata: {
            ...metadata,
            hasPart: updatedParts
          }
        }
      });

      updatedNodes.push(updatedNode);
    }

    await this.appendErrors(db, errors);

    return updatedNodes;
  }

  async assignParentsToNodes(db: PrismaClient, nodes: PrismaNode[]) {
    const errors = this.prismaBundle.errors as Prisma.JsonObject[];

    for (const node of nodes) {
      const metadata = node.metadata as Prisma.JsonObject;
      const parts = (metadata.hasPart || []) as Prisma.JsonObject[];

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
    let nodes = (await this.createNodesFromSitemap(db, sitemap))
      .filter(Boolean) as PrismaNode[]

    nodes = await this.splitPartNodes(db, nodes);
    await this.assignParentsToNodes(db, nodes);

    await this.reloadFromDb(db);
  }

  async importFromZipFile(db: PrismaClient, zipContent: File | Buffer | ArrayBuffer, isBase64: boolean = false) {
    const zip = await JSZip.loadAsync(zipContent, { base64: isBase64 });

    const sitemapFile = zip.file('sitemap.xml');
    if (!sitemapFile) {
      throw new Error('sitemap.xml not found in the zip file');
    }

    const sitemapContent = await sitemapFile.async('text');
    const parsedSitemap = await parseStringPromise(sitemapContent);
    const urls = parsedSitemap.urlset.url.map((url: any) => url.loc[0]);

    const filesTexts: { [key: string]: string } = {};

    for (const url of urls) {
      const file = zip.file(url);
      if (!file) {
        throw new Error(`File not found in the zip: ${url}`);
      }

      filesTexts[url] =await file.async('text');
    }

    const nodes = await this.createNodesFromFilesTexts(db, filesTexts);
    await this.splitPartNodes(db, nodes);
    await this.assignParentsToNodes(db, nodes);

    await this.reloadFromDb(db);

    return this.prismaBundle;
  }
}
