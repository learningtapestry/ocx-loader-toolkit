import {describe, it, expect, beforeEach} from "vitest";

import { Node, Bundle, Prisma } from "@prisma/client";
import db from "db";

import OcxNode from "../OcxNode";
import OcxBundle from "../OcxBundle";

describe('OcxNode', () => {
  let ocxNode1: OcxNode;
  let ocxNode2: OcxNode;
  let ocxNode3: OcxNode;
  let prismaBundle: Bundle & { nodes: Node[] };
  let ocxBundle: OcxBundle;

  beforeEach(async () => {
    await db.$reset();

    prismaBundle = await db.bundle.create({
      data: {
        name: 'name',
        sitemapUrl: 'http://test.com',
        nodes: {
          create: [
            {
              id: 1,
              metadata: {
                "@id": 'node1',
                "@type": 'type',
                "name": 'name1',
                "alternateName": 'alternateName1',
                "hasPart": [
                  {
                    "@id": 'node2',
                    "@type": 'type',
                  }
                ],
                "isPartOf": null
              },
              parentId: null,
              positionAsChild: 0,
              content: '',
              url: 'http://localhost'
            },
            {
              id: 2,
              metadata: {
                "@id": 'node2',
                "@type": 'type',
                "name": 'name2',
                "alternateName": 'alternateName2',
                "hasPart": [],
                "isPartOf": {
                  "@id": 'node1',
                  "@type": 'type',
                }
              },
              parentId: 1,
              positionAsChild: 0,
              content: '',
              url: 'http://localhost'
            },
            {
              id: 3,
              metadata: {
                "@id": 'node3',
                "@type": 'type',
                "name": 'name3',
                "alternateName": 'alternateName3',
                "hasPart": [],
                "isPartOf": null
              },
              parentId: null,
              positionAsChild: 0,
              content: '',
              url: 'http://localhost'
            },
          ]
        }
      },
      include: { nodes: true }
    });

    ocxBundle = new OcxBundle(prismaBundle, prismaBundle.nodes);
    ocxNode1 = ocxBundle.findNodeByDbId(1);
    ocxNode2 = ocxBundle.findNodeByDbId(2);
    ocxNode3 = ocxBundle.findNodeByDbId(3);
  });

  const reloadFromDb = async () => {
    await ocxBundle.reloadFromDb(db);
    ocxNode1 = ocxBundle.findNodeByDbId(1);
    ocxNode2 = ocxBundle.findNodeByDbId(2);
    ocxNode3 = ocxBundle.findNodeByDbId(3);
  };

  describe('#removeChild', () => {
    it('should remove child', async () => {
      await ocxNode1.removeChild(db, ocxNode2);

      await reloadFromDb();

      expect(ocxNode1.children).to.be.empty;
      expect(ocxNode2.prismaNode.parentId).to.be.null;
      expect(ocxNode2.isPartOf).to.be.null;
    });
  });

  describe('#setParent', () => {
    it('should set parent for a node without parent', async () => {
      await ocxNode3.setParent(db, ocxNode2, 'firstChild');

      await reloadFromDb();

      expect(ocxNode3.isPartOf?.ocxId).to.equal(ocxNode2.ocxId);

      expect(ocxNode2.children).to.have.length(1);
      expect(ocxNode2.children[0]?.ocxId).to.equal(ocxNode3.ocxId);
    });

    it('should set parent for a node with parent', async () => {
      await ocxNode2.setParent(db, ocxNode3, 'firstChild');

      await reloadFromDb();

      expect(ocxNode2.parent?.ocxId).to.equal(ocxNode3.ocxId);

      expect(ocxNode3.children).to.have.length(1);
      expect(ocxNode3.children[0]?.ocxId).to.equal(ocxNode2.ocxId);

      expect(ocxNode1.children).to.have.length(0);
    });
  });

  describe('#delete', () => {
    it('should delete a node without parent', async () => {
      await ocxNode3.delete(db);

      await reloadFromDb();

      expect(ocxBundle.ocxNodes).to.have.length(2);
      expect(ocxBundle.ocxNodes.map((node) => node.ocxId)).to.have.members([ocxNode1.ocxId, ocxNode2.ocxId]);
    });

    it('should delete a node with parent', async () => {
      await ocxNode2.delete(db);

      await reloadFromDb();

      expect(ocxBundle.ocxNodes).to.have.length(2);
      expect(ocxBundle.ocxNodes.map((node) => node.ocxId)).to.have.members([ocxNode1.ocxId, ocxNode3.ocxId]);

      expect(ocxNode1.children).to.have.length(0);
    });

    it('should delete a node with children', async () => {
      await ocxNode1.delete(db);

      await reloadFromDb();

      expect(ocxBundle.ocxNodes).to.have.length(2);
      expect(ocxBundle.ocxNodes.map((node) => node.ocxId)).to.have.members([ocxNode2.ocxId, ocxNode3.ocxId]);

      expect(ocxNode2.parent).to.be.null;
    });
  });

  describe ('#deleteBranch', () => {
    // add two children to ocxNode2
    // then add a child to one of the children
    // then delete ocxNode2
    // the children of ocxNode2 should be deleted

    it('should delete a node with children', async () => {
      await db.node.createMany({
        data: [
          {
            id: 4,
            bundleId: prismaBundle.id,
            metadata: {
              "@id": 'node4',
              "@type": 'type',
              "name": 'name4',
              "alternateName": 'alternateName4',
              "hasPart": [],
              "isPartOf": null
            },
            parentId: null,
            positionAsChild: 0,
            content: '',
            url: 'http://localhost',
          },
          {
            id: 5,
            bundleId: prismaBundle.id,
            metadata: {
              "@id": 'node5',
              "@type": 'type',
              "name": 'name5',
              "alternateName": 'alternateName5',
              "hasPart": [],
              "isPartOf": null
            },
            parentId: null,
            positionAsChild: 1,
            content: '',
            url: 'http://localhost'
          },
          {
            id: 6,
            bundleId: prismaBundle.id,
            metadata: {
              "@id": 'node6',
              "@type": 'type',
              "name": 'name6',
              "alternateName": 'alternateName6',
              "hasPart": [],
              "isPartOf": null
            },
            parentId: null,
            positionAsChild: 0,
            content: '',
            url: 'http://localhost'
          }
        ]
      });

      await reloadFromDb();

      expect(ocxBundle.ocxNodes).to.have.length(6);

      const ocxNode4 = ocxBundle.findNodeByDbId(4);
      const ocxNode5 = ocxBundle.findNodeByDbId(5);
      const ocxNode6 = ocxBundle.findNodeByDbId(6);

      await ocxNode4.setParent(db, ocxNode2, 'firstChild');
      await reloadFromDb();

      await ocxNode5.setParent(db, ocxNode2, 'lastChild');
      await reloadFromDb();

      await ocxNode6.setParent(db, ocxNode5, 'firstChild');
      await reloadFromDb();

      expect(ocxNode2.children).to.have.length(2);

      await ocxNode2.deleteBranch(db);

      await reloadFromDb();

      console.log(ocxBundle.ocxNodes.map((node) => node.ocxId));

      expect(ocxBundle.ocxNodes).to.have.length(2);
      expect(ocxBundle.ocxNodes.map((node) => node.ocxId)).to.have.members([ocxNode1.ocxId, ocxNode3.ocxId]);

      expect(ocxNode1.children).to.have.length(0);
    });
  });

  describe('#removeChildrenNotFound', () => {
    let ocxNode4: OcxNode;

    beforeEach(async () => {
      await db.node.create({
        data: {
          id: 4,
          bundleId: prismaBundle.id,
          metadata: {
            "@id": 'node4',
            "@type": 'type',
            "name": 'name4',
            "alternateName": 'alternateName4',
            "hasPart": [
              {
                "@id": 'nonexistent',
                "@type": 'type',
                "name": 'nonexistent',
                "alternateName": 'nonexistent'
              },
              {
                "@id": 'node2',
                "@type": 'type',
                "name": 'node2',
                "alternateName": 'node2'
              }
            ],
            "isPartOf": null
          },
          parentId: null,
          positionAsChild: 0,
          content: '',
          url: 'http://localhost'
        }
      });

      await reloadFromDb();

      ocxNode4 = ocxBundle.findNodeByDbId(4);
    });

    it('should remove children not found', async () => {
      await ocxNode4.removeChildrenNotFound(db);

      await reloadFromDb();
      ocxNode4 = ocxBundle.findNodeByDbId(4);

      expect(ocxNode4.children).to.have.length(1);
      expect(ocxNode4.children[0].ocxId).to.equal(ocxNode2.ocxId);

      expect(ocxNode4.metadata.hasPart).to.have.length(1);
    });

    it('should not change anything if all children are found', async () => {
      await ocxNode1.removeChildrenNotFound(db);

      await reloadFromDb();

      expect(ocxNode1.children).to.have.length(1);
      expect(ocxNode1.metadata.hasPart).to.have.length(1);
    });
  });
});
