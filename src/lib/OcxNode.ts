import { Node as PrismaNode, Prisma } from "@prisma/client";

import OcxBundle from "@/src/lib/OcxBundle"

export default class OcxNode {
  prismaNode: PrismaNode;
  ocxBundle: OcxBundle;

  childrenNotFoundData: Prisma.JsonObject[] = [];

  constructor(prismaNode: PrismaNode, ocxBundle: OcxBundle) {
    this.prismaNode = prismaNode;
    this.ocxBundle = ocxBundle;
  }

  get metadata() {
    return this.prismaNode.metadata as Prisma.JsonObject;
  }

  get ocxId() : string {
    return this.metadata["@id"] as string;
  }

  // the parent here is based on hasPart. In theory it should be the
  // same as isPartOf, but an incongruent OCX file could have a different - which is not acceptable
  get parent() : OcxNode | null {
    const parentId = this.prismaNode.parentId;
    const parent = parentId ? this.ocxBundle.ocxNodes.find((node) => node.prismaNode.id === parentId) : null;
    return parent || null;
  }

  get isPartOf() : OcxNode | null {
    const parentId = this.metadata.isPartOf ? (this.metadata.isPartOf as Prisma.JsonObject)["@id"] as string : null;
    return parentId ? this.ocxBundle.findNode(parentId) : null;
  }

  get children() : OcxNode[] {
    if (!this.metadata.hasPart) return [];

    const children : OcxNode[] = [];
    const childrenNotFoundData : Prisma.JsonObject[] = [];

    (this.metadata.hasPart as Prisma.JsonObject[]).forEach((childData) => {
      const ocxId = childData["@id"] as string;
      const child = this.ocxBundle.findNode(ocxId);

      if (child) {
        children.push(child);
      } else {
        childrenNotFoundData.push(childData);
      }
    });

    this.childrenNotFoundData = childrenNotFoundData;

    return children;
  }
}
