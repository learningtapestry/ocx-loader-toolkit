import { Bundle as PrismaBundle, Node as PrismaNode, PrismaClient } from "@prisma/client"

import OcxNode from "./OcxNode"

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
}
