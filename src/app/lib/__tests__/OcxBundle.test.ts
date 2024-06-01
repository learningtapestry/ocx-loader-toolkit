import { describe, it, expect, beforeEach } from "vitest";

import fs from 'fs';
import path from 'path';

import { setupRecorder } from "nock-record";
const record = setupRecorder();

import OcxBundle from "../OcxBundle";

import db from "db";
import { Bundle, Prisma, Node } from "@prisma/client"

import cheerio from 'cheerio';

describe('OcxBundle', () => {
  beforeEach(async () => {
    await db.$reset();
  });

  describe('#importFromSitemap', () => {
    describe('when the sitemap is from IM', () => {
      const name = 'Grade 6 Unit 2';
      const sitemapUrl = 'https://raw.githubusercontent.com/illustrativemathematics/static-ocx/main/build/cms_im-PR1334/ed-node-244422/sitemap.xml';

      let prismaBundle: Bundle;
      let ocxBundle: OcxBundle;

      beforeEach(async () => {
        prismaBundle = await db.bundle.create({
          data: {
            name: name,
            sitemapUrl: sitemapUrl,
          }
        });

        ocxBundle = new OcxBundle(prismaBundle, []);
      });

      it('should load data from the sitemap', async () => {
        const { completeRecording, assertScopesFinished } = await record("OcxBundle#importFromSitemap-IM");

        await ocxBundle.importFromSitemap(db);

        // Complete the recording, allow for Nock to write fixtures
        completeRecording();
        // Optional; assert that all recorded fixtures have been called
        assertScopesFinished();

        expect(ocxBundle.ocxNodes.length).toEqual(117);
        expect(ocxBundle.rootNodes.length).toEqual(35);
        // there are three nodes with the same id in the IM data
        expect((ocxBundle.prismaBundle.errors as Prisma.JsonArray).length).toEqual(2);

        expect(ocxBundle.allTypes.length).toEqual(5);
        expect(ocxBundle.allTypesNodeCount['oer:Unit']).toEqual(6);
        expect(ocxBundle.allCombinedTypes.length).toEqual(5);
        expect(ocxBundle.allCombinedTypesNodeCount['oer:Unit']).toEqual(6);
        expect(ocxBundle.allProperties.length).toEqual(29);
        expect(Object.keys(ocxBundle.allPropertiesNodeCount).length).toEqual(31);
        expect(ocxBundle.allPropertiesNodeCount['@id']).toEqual(117);
        expect(Object.keys(ocxBundle.allScalarPropertiesValues).length).toEqual(20);
        expect(ocxBundle.allScalarPropertiesValues['name'].length).toEqual(115);
        expect(Object.keys(ocxBundle.allObjectPropertiesValues).length).toEqual(9);
        expect(ocxBundle.allObjectPropertiesValues['hasPart'].length).toEqual(25);
      }, 30000);
    });

    describe('when the sitemap points to just one file with multiple nodes', () => {
      const name = 'Odell test';
      // TODO: replace with the actual sitemap URL
      const sitemapUrl = 'https://jay.ocx-odell-lcms.c66.me/ocx/lessons/10/d3/2.html';

      let prismaBundle: Bundle;

      beforeEach(async () => {
        prismaBundle = await db.bundle.create({
          data: {
            name: name,
            sitemapUrl: sitemapUrl,
          }
        });
      });

      it('should load multiple nodes splitting the only file from a mocked sitemap ', async () => {
        const { completeRecording, assertScopesFinished } = await record("OcxBundle#importFromSitemap-Odell");

        const parsedSitemap = {
          urls: [
            '2.html'
          ],
          content: {}
        }

        const ocxBundle = new OcxBundle(prismaBundle, []);
        await ocxBundle.importFromSitemap(db, parsedSitemap);

        // Complete the recording, allow for Nock to write fixtures
        completeRecording();
        // Optional; assert that all recorded fixtures have been called
        assertScopesFinished();

        expect(ocxBundle.ocxNodes.length).toEqual(9);
        expect(ocxBundle.rootNodes.length).toEqual(1);
        expect((ocxBundle.prismaBundle.errors as Prisma.JsonArray).length).toEqual(0);

        expect(ocxBundle.allTypes.length).toEqual(2);
        expect(ocxBundle.allCombinedTypes.length).toEqual(2);
        expect(ocxBundle.allProperties.length).toEqual(13);
        expect(Object.keys(ocxBundle.allPropertiesNodeCount).length).toEqual(15);
        expect(ocxBundle.allPropertiesNodeCount['@id']).toEqual(9);
        expect(Object.keys(ocxBundle.allScalarPropertiesValues).length).toEqual(6);
        expect(ocxBundle.allScalarPropertiesValues['name'].length).toEqual(9);
        expect(Object.keys(ocxBundle.allObjectPropertiesValues).length).toEqual(7);
        expect(ocxBundle.allObjectPropertiesValues['@context'].length).toEqual(1);
      });
    });
  });

  describe('#importFromZipFile', () => {
    const name = 'Grade 6 Unit 2';
    const sitemapUrl = 'https://raw.githubusercontent.com/illustrativemathematics/static-ocx/main/build/cms_im-PR1334/ed-node-244422/sitemap.xml';

    let prismaBundle: Bundle;
    let ocxBundle: OcxBundle;

    beforeEach(async () => {
      prismaBundle = await db.bundle.create({
        data: {
          name: name,
          sitemapUrl: sitemapUrl,
        }
      });

      ocxBundle = new OcxBundle(prismaBundle, []);
    });

    it('should load data from an IM zip file', async () => {
      const zipData = fs.readFileSync(path.join(__dirname, 'fixtures', 'im_bundle.ocx.zip'));

      await ocxBundle.importFromZipFile(db, zipData);

      expect(ocxBundle.ocxNodes.length).toEqual(115);
      expect(ocxBundle.rootNodes.length).toEqual(43);
      expect((ocxBundle.prismaBundle.errors as Prisma.JsonArray).length).toEqual(0);

      expect(ocxBundle.allTypes.length).toEqual(5);
      expect(ocxBundle.allCombinedTypes.length).toEqual(5);
      expect(ocxBundle.allProperties.length).toEqual(29);
      expect(Object.keys(ocxBundle.allScalarPropertiesValues).length).toEqual(20);
      expect(ocxBundle.allScalarPropertiesValues['name'].length).toEqual(115);
    });

    it('should load data from an OSE zip file', async () => {
      const zipData = fs.readFileSync(path.join(__dirname, 'fixtures', 'ose_bundle.ocx.zip'));

      await ocxBundle.importFromZipFile(db, zipData);

      expect(ocxBundle.ocxNodes.length).toEqual(30);
      expect(ocxBundle.rootNodes.length).toEqual(1);
      expect((ocxBundle.prismaBundle.errors as Prisma.JsonArray).length).toEqual(6);

      expect(ocxBundle.allTypes.length).toEqual(6);
      expect(ocxBundle.allTypesNodeCount['oer:Lesson']).toEqual(8);
      expect(ocxBundle.allCombinedTypes.length).toEqual(4);
      expect(ocxBundle.allCombinedTypesNodeCount['Course oer:Lesson']).toEqual(8);
      expect(ocxBundle.allProperties.length).toEqual(23);
      expect(Object.keys(ocxBundle.allPropertiesNodeCount).length).toEqual(25);
      expect(ocxBundle.allPropertiesNodeCount['@id']).toEqual(30);
      expect(Object.keys(ocxBundle.allScalarPropertiesValues).length).toEqual(15);
      expect(ocxBundle.allScalarPropertiesValues['name'].length).toEqual(23);
    });

    describe("full circle", () => {
      it("loads, exports, and re-loads without changing structure for IM", async () => {
        const { completeRecording, assertScopesFinished } = await record("OcxBundle#importFromSitemap-IM");

        await ocxBundle.importFromSitemap(db);

        // Complete the recording, allow for Nock to write fixtures
        completeRecording();
        // Optional; assert that all recorded fixtures have been called
        assertScopesFinished();

        const exportedZip = await ocxBundle.exportZip();

        // convert the exportedZip blob into a buffer
        const buffer = await new Response(exportedZip).arrayBuffer();

        const reloadedOcxBundle = new OcxBundle(prismaBundle, []);
        await reloadedOcxBundle.importFromZipFile(db, buffer);

        expect(reloadedOcxBundle.ocxNodes.length).toEqual(ocxBundle.ocxNodes.length);
        expect(reloadedOcxBundle.rootNodes.length).toEqual(ocxBundle.rootNodes.length);
        expect((reloadedOcxBundle.prismaBundle.errors as Prisma.JsonArray).length).toEqual(0);

        // compare each ocxNode from the two bundles
        for (let i = 0; i < ocxBundle.ocxNodes.length; i++) {
          const node1 = ocxBundle.ocxNodes[i];
          const node2 = reloadedOcxBundle.findNodeByOcxId(node1.ocxId);

          expect(node1.metadata).toEqual(node2.metadata);

          const html1 = cheerio.load(node1.prismaNode.content).html();
          const html2 = cheerio.load(node2.prismaNode.content).html();
          expect(html1?.replace(/\s/g, '')).toEqual(html2?.replace(/\s/g, ''));

          expect(node1.children.map((child) => child.ocxId)).toEqual(node2.children.map((child) => child.ocxId));
        }
      }, 30000);

      it("loads, exports, and re-loads without changing structure for OSE", async () => {
        const zipData = fs.readFileSync(path.join(__dirname, 'fixtures', 'ose_bundle.ocx.zip'));

        await ocxBundle.importFromZipFile(db, zipData);

        const exportedZip = await ocxBundle.exportZip();

        // convert the exportedZip blob into a buffer
        const buffer = await new Response(exportedZip).arrayBuffer();

        const reloadedOcxBundle = new OcxBundle(prismaBundle, []);
        await reloadedOcxBundle.importFromZipFile(db, buffer);

        expect(reloadedOcxBundle.ocxNodes.length).toEqual(ocxBundle.ocxNodes.length);
        expect(reloadedOcxBundle.rootNodes.length).toEqual(ocxBundle.rootNodes.length);
        expect((reloadedOcxBundle.prismaBundle.errors as Prisma.JsonArray).length).toEqual(0);

        // compare each ocxNode from the two bundles
        for (let i = 0; i < ocxBundle.ocxNodes.length; i++) {
          const node1 = ocxBundle.ocxNodes[i];
          const node2 = reloadedOcxBundle.findNodeByOcxId(node1.ocxId);

          expect({ ...node1.metadata, hasPart: [] }).toEqual({ ...node2.metadata, hasPart: [] });

          const hasPart1 = node1.metadata.hasPart as Prisma.JsonObject[];
          const hasPart2 = node2.metadata.hasPart as Prisma.JsonObject[];

          expect(hasPart1.map((p: Prisma.JsonObject) => p['@id'])).toEqual(hasPart2.map((p: Prisma.JsonObject) => p['@id']));

          const html1 = cheerio.load(node1.prismaNode.content).html();
          const html2 = cheerio.load(node2.prismaNode.content).html();
          expect(html1?.replace(/\s/g, '')).toEqual(html2?.replace(/\s/g, ''));

          expect(node1.children.map((child) => child.ocxId)).toEqual(node2.children.map((child) => child.ocxId));
        }
      }, 100000);
    });
  });

  describe('#splitPartNodes', () => {
    const name = 'test';
    const sitemapUrl = 'test';

    let prismaBundle: Bundle;
    let ocxBundle: OcxBundle;
    let nodes: Node[] = [];

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

    describe('when there are three levels both in hasPart and content', () => {
      beforeEach(async () => {
        nodes.push(await db.node.create({
          data: {
            metadata: {
              "@id": 'node1',
              "@type": 'type',
              name: 'node1',
              alternateName: 'alternateNode1',
              hasPart: [
                {
                  "@id": '#node2',
                  "@type": 'type',
                  name: 'node2',
                  alternateName: 'alternateNode2',
                  isPartOf: {
                    "@id": 'node1',
                    "@type": 'type',
                  },
                  hasPart: [
                    {
                      "@id": '#node3',
                      "@type": 'type',
                      name: 'node3',
                      alternateName: 'alternateNode3',
                      isPartOf: {
                        "@id": 'node2',
                        "@type": 'type',
                      },
                    }
                  ]
                }
              ],
              "isPartOf": null
            },
            parentId: null,
            content: `
<body>
  <div id="node1">
    This is node 1
    <div id="node2">
      This is node 2
      <div id="node3">
        This is node 3
      </div>
    </div>
  </div>
</body>
`,
            url: 'http://localhost',
            bundleId: prismaBundle.id
          }
        }));
      });

      it('should split the part nodes', async () => {
        const splitNodes = await ocxBundle.splitPartNodes(db, nodes);

        expect((ocxBundle.prismaBundle.errors as Prisma.JsonObject[])!.length).toEqual(0);
        expect(splitNodes.length).toEqual(3);

        let metadata = splitNodes[0].metadata as Prisma.JsonObject;
        let $content = cheerio.load(splitNodes[0].content);

        expect(metadata['@id']).toEqual('node1');
        expect(metadata.name).toEqual('node1');
        expect(metadata.hasPart).toEqual([
          {
            "@id": '#node2',
            "@type": 'type',
            name: 'node2'
          }
        ]);
        expect($content('[id="node1"]').text()).toContain('This is node 1');
        expect($content('[id="node1"]').children().length).toEqual(0);

        metadata = splitNodes[1].metadata as Prisma.JsonObject;
        $content = cheerio.load(splitNodes[1].content);

        expect(metadata['@id']).toEqual('#node2');
        expect(metadata.name).toEqual('node2');
        expect(metadata.hasPart).toEqual([
          {
            "@id": '#node3',
            "@type": 'type',
            name: 'node3'
          }
        ]);
        expect($content('[id="node2"]').text()).toContain('This is node 2');
        expect($content('[id="node2"]').children().length).toEqual(0);

        metadata = splitNodes[2].metadata as Prisma.JsonObject;
        $content = cheerio.load(splitNodes[2].content);

        expect(metadata['@id']).toEqual('#node3');
        expect(metadata.name).toEqual('node3');
        expect(metadata.hasPart).toEqual([]);
        expect($content('[id="node3"]').text()).toContain('This is node 3');
        expect($content('[id="node3"]').children().length).toEqual(0);

      });
    });

    describe('when there are duplicated ids which can be disambiguated', () => {
      beforeEach(async () => {
        nodes.push(await db.node.create({
          data: {
            metadata: {
              "@id": 'node1',
              "@type": 'type',
              name: 'node1',
              alternateName: 'alternateNode1',
              hasPart: [
                {
                  "@id": '#node2',
                  "@type": 'type',
                  name: 'node2',
                  alternateName: 'alternateNode2',
                  isPartOf: {
                    "@id": 'node1',
                    "@type": 'type',
                  },
                  hasPart: [
                    {
                      "@id": '#node3',
                      "@type": 'type',
                      name: 'node3',
                      alternateName: 'alternateNode3',
                      isPartOf: {
                        "@id": 'node2',
                        "@type": 'type',
                      },
                    }
                  ]
                },
                {
                  "@id": '#node4',
                  "@type": 'type',
                  name: 'node4',
                  alternateName: 'alternateNode2',
                  isPartOf: {
                    "@id": 'node1',
                    "@type": 'type',
                  },
                  hasPart: [
                    {
                      "@id": '#node3',
                      "@type": 'type',
                      name: 'node3',
                      alternateName: 'alternateNode3',
                      isPartOf: {
                        "@id": 'node4',
                        "@type": 'type',
                      },
                    }
                  ]
                },
              ],
              "isPartOf": null
            },
            parentId: null,
            content: `
<body>
  <div id="node1">
    This is node 1
    <div id="node2">
      This is node 2
      <div id="node3">
        This is node 3
      </div>
    </div>
    <div id="node4">
      This is node 4
      <div id="node3">
        This is node 3 duplicated
      </div>
    </div>
  </div>
</body>
`,
            url: 'http://localhost',
            bundleId: prismaBundle.id
          }
        }));
      });

      it('should split the part nodes and rename the duplicated one', async () => {
        const splitNodes = await ocxBundle.splitPartNodes(db, nodes);

        expect((ocxBundle.prismaBundle.errors as Prisma.JsonObject[])!.length).toEqual(1);
        expect(splitNodes.length).toEqual(5);

        let metadata = splitNodes[0].metadata as Prisma.JsonObject;
        let $content = cheerio.load(splitNodes[0].content);

        expect(metadata['@id']).toEqual('node1');
        expect(metadata.name).toEqual('node1');
        expect(metadata.hasPart).toEqual([
          {
            "@id": '#node2',
            "@type": 'type',
            name: 'node2'
          },
          {
            "@id": '#node4',
            "@type": 'type',
            name: 'node4'
          }
        ]);
        expect($content('[id="node1"]').text()).toContain('This is node 1');
        expect($content('[id="node1"]').children().length).toEqual(0);

        metadata = splitNodes[1].metadata as Prisma.JsonObject;
        $content = cheerio.load(splitNodes[1].content);

        expect(metadata['@id']).toEqual('#node2');
        expect(metadata.name).toEqual('node2');
        expect(metadata.hasPart).toEqual([
          {
            "@id": '#node3',
            "@type": 'type',
            name: 'node3'
          }
        ]);
        expect($content('[id="node2"]').text()).toContain('This is node 2');
        expect($content('[id="node2"]').children().length).toEqual(0);

        metadata = splitNodes[2].metadata as Prisma.JsonObject;
        $content = cheerio.load(splitNodes[2].content);

        expect(metadata['@id']).toEqual('#node4');
        expect(metadata.name).toEqual('node4');
        expect(metadata.hasPart).toEqual([
          {
            "@id": '#node3-2',
            "@type": 'type',
            name: 'node3'
          }
        ]);
        expect($content('[id="node4"]').text()).toContain('This is node 4');
        expect($content('[id="node4"]').children().length).toEqual(0);

        metadata = splitNodes[3].metadata as Prisma.JsonObject;
        $content = cheerio.load(splitNodes[3].content);

        expect(metadata['@id']).toEqual('#node3');
        expect(metadata.name).toEqual('node3');
        expect(metadata.hasPart).toEqual([]);
        expect($content('[id="node3"]').text()).toContain('This is node 3');
        expect($content('[id="node3"]').children().length).toEqual(0);

        metadata = splitNodes[4].metadata as Prisma.JsonObject;
        $content = cheerio.load(splitNodes[4].content);

        expect(metadata['@id']).toEqual('#node3-2');
        expect(metadata.name).toEqual('node3');
        expect(metadata.hasPart).toEqual([]);
        expect($content('[id="node3-2"]').text()).toContain('This is node 3 duplicated');
        expect($content('[id="node3-2"]').children().length).toEqual(0);
      }, 100000);
    });

    describe('when the part is already a node instead of a fragment', () => {
      beforeEach(async () => {
        nodes.push(await db.node.create({
          data: {
            metadata: {
              "@id": 'node1',
              "@type": 'type',
              name: 'node1',
              alternateName: 'alternateNode1',
              hasPart: [
                {
                  "@id": '#node2',
                  "@type": 'type',
                  name: 'node2',
                  alternateName: 'alternateNode2',
                  isPartOf: {
                    "@id": 'node1',
                    "@type": 'type',
                  },
                  hasPart: [
                    {
                      "@id": '#node3',
                      "@type": 'type',
                      name: 'node3',
                      alternateName: 'alternateNode3',
                      isPartOf: {
                        "@id": 'node2',
                        "@type": 'type',
                      },
                    }
                  ]
                }
              ],
              "isPartOf": null
            },
            parentId: null,
            content: `
<body>
  <div id="node1">
    This is node 1
    <div id="node2">
      This is node 2
    </div>
  </div>
</body>
`,
            url: 'http://localhost',
            bundleId: prismaBundle.id
          }
        }));

        // create node3
        nodes.push(await db.node.create({
          data: {
            metadata: {
              "@id": '#node3',
              "@type": 'type',
              name: 'node3',
              alternateName: 'alternateNode3',
              hasPart: [],
              isPartOf: {
                "@id": '#node2',
                "@type": 'type',
              }
            },
            parentId: null,
            content: `
<body>
  <div id="node3">
    This is node 3
  </div>
</body>
`,
            url: 'http://localhost',
            bundleId: prismaBundle.id
          }
        }))
      });

      it('should find the existing node', async () => {
        const splitNodes = await ocxBundle.splitPartNodes(db, nodes);

        expect((ocxBundle.prismaBundle.errors as Prisma.JsonObject[])!.length).toEqual(0);
        expect(splitNodes.length).toEqual(3);

        let metadata = splitNodes[0].metadata as Prisma.JsonObject;
        let $content = cheerio.load(splitNodes[0].content);

        expect(metadata['@id']).toEqual('node1');
        expect(metadata.name).toEqual('node1');
        expect(metadata.hasPart).toEqual([
          {
            "@id": '#node2',
            "@type": 'type',
            name: 'node2'
          }
        ]);
        expect($content('[id="node1"]').text()).toContain('This is node 1');
        expect($content('[id="node1"]').children().length).toEqual(0);

        metadata = splitNodes[2].metadata as Prisma.JsonObject;
        $content = cheerio.load(splitNodes[2].content);

        expect(metadata['@id']).toEqual('#node2');
        expect(metadata.name).toEqual('node2');
        expect(metadata.hasPart).toEqual([
          {
            "@id": '#node3',
            "@type": 'type',
            name: 'node3',
            alternateName: 'alternateNode3'
          }
        ]);
        expect($content('[id="node2"]').text()).toContain('This is node 2');
        expect($content('[id="node2"]').children().length).toEqual(0);

        metadata = splitNodes[1].metadata as Prisma.JsonObject;
        $content = cheerio.load(splitNodes[1].content);

        expect(metadata['@id']).toEqual('#node3');
        expect(metadata.name).toEqual('node3');
        expect(metadata.hasPart).toEqual([]);
        expect($content('[id="node3"]').text()).toContain('This is node 3');
        expect($content('[id="node3"]').children().length).toEqual(0);

      });
    }, 100000);
  });

  describe('#assignParentsToNodes', () => {
    // TODO
  });
});
