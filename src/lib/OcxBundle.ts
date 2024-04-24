import { Bundle as PrismaBundle, Node as PrismaNode, Prisma } from "@prisma/client";

import OcxNode from "@/src/lib/OcxNode"

export default class OcxBundle {
  prismaBundle: PrismaBundle;
  ocxNodes: OcxNode[];

  constructor(prismaBundle: PrismaBundle, nodes: PrismaNode[]) {
    this.prismaBundle = prismaBundle;

    this.ocxNodes = nodes.map((node) => new OcxNode(node, this));
  }

  findNode(ocxId: string) : OcxNode {
    return this.ocxNodes.find((node) => node.ocxId === ocxId) as OcxNode;
  }

  get rootNodes() {
    return this.ocxNodes.filter((node) => !node.parent);
  }
}
