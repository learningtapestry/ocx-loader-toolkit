import { Node as PrismaNode, Prisma, PrismaClient } from "@prisma/client"
import { ErrorObject } from "ajv"

import OcxBundle from "./OcxBundle";

import validateNodeProperties from "@/src/app/lib/validation/validateNodeProperties"

export interface NodePartData {
  "@id": string;
  "@type": string | string[];
  name: string;
  alternateName: string;
}

export interface PropertyValidationResult {
  propertyName: string;
  isRecognizedProperty: boolean;

  isValid: boolean;

  validationErrors: ErrorObject[];
}

export default class OcxNode {
  prismaNode: PrismaNode;
  ocxBundle: OcxBundle;

  childrenNotFoundData: Prisma.JsonObject[] = [];

  propertiesValidationData = {
    propertiesValidationResultsByProperty: {} as {[key: string]: PropertyValidationResult},
    missingProperties: [] as string[],
    nonStandardProperties: [] as string[],
    hasUnrecognizedType: false,
    jsonIsValid: false
  }

  constructor(prismaNode: PrismaNode, ocxBundle: OcxBundle) {
    this.prismaNode = prismaNode;
    this.ocxBundle = ocxBundle;

    this.propertiesValidationData = validateNodeProperties(this.metadata, this.ocxTypes)
  }

  get metadata() {
    return this.prismaNode.metadata as Prisma.JsonObject;
  }

  get ocxId() : string {
    return this.metadata["@id"] as string;
  }

  get dbId() : number {
    return this.prismaNode.id;
  }

  get ocxType() : string | string[] {
    return this.metadata["@type"] as string | string[];
  }

  get ocxTypes() : string[] {
    if (Array.isArray(this.metadata["@type"])) {
      return this.metadata["@type"] as string[];
    }

    return [this.metadata["@type"] as string];
  }

  get ocxCombinedTypes() : string {
    return this.ocxTypes.sort().join(' ');
  }

  // the parent here is based on hasPart. In theory it should be the
  // same as isPartOf, but an incongruent OCX file could have a different - which is not acceptable
  get parent() : OcxNode | null {
    const parentId = this.prismaNode.parentId;
    const parent = parentId ? this.ocxBundle.ocxNodes.find((node) => node.prismaNode.id === parentId) : null;
    return parent || null;
  }

  get isPartOf() : OcxNode | null {
    const parentId = this.metadata.isPartOf ? (this.metadata.isPartOf as unknown as NodePartData)["@id"] as string : null;
    return parentId ? this.ocxBundle.findNodeByOcxId(parentId) : null;
  }

  get children() : OcxNode[] {
    if (!this.metadata.hasPart) return [];

    const children : OcxNode[] = [];
    const childrenNotFoundData : Prisma.JsonObject[] = [];

    (this.metadata.hasPart as Prisma.JsonObject[]).forEach((childData) => {
      const ocxId = childData["@id"] as string;
      const child = this.ocxBundle.findNodeByOcxId(ocxId);

      if (child) {
        children.push(child);
      } else {
        childrenNotFoundData.push(childData);
      }
    });

    this.childrenNotFoundData = childrenNotFoundData;

    return children;
  }

  get asPartData() : NodePartData {
    return {
      "@id": this.ocxId,
      "@type": this.ocxType,
      "name": this.metadata.name as string,
      "alternateName": this.metadata.alternateName as string
    }
  }

  get asHtml() : string {
    return `
      <!DOCTYPE html PUBLIC "UTF-8">
      <html lang="en">
        <head>
          <title>${this.metadata.name}</title>

          <script type="application/ld+json">${JSON.stringify(this.metadata)}</script>
        </head>
        <body>
          ${this.prismaNode.content}
        </body>
      </html>
    `;
  }

  async removeChild(db: PrismaClient, child: OcxNode) {
    await db.$transaction([
      db.node.update({
        where: { id: this.prismaNode.id },
        data: {
          metadata: {
            ...this.metadata,
            hasPart: (this.metadata.hasPart as Prisma.JsonObject[])
              .filter((childData) => childData["@id"] !== child.ocxId)
          }
        }
      }),
      db.node.update({
        where: { id: child.prismaNode.id },
        data: {
          metadata: {
            ...child.metadata,
            isPartOf: null,
          },
          parentId: null
        }
      })
    ]);
  }

  async setParent(db: PrismaClient, parent: OcxNode, position: 'firstChild' | 'lastChild') {
    await db.$transaction(async (tx) => {
      // update the previous parent
      if (this.parent) {
        await db.node.update({
          where: { id: this.parent.prismaNode.id },
          data: {
            metadata: {
              ...this.parent.metadata,
              hasPart: (this.parent.metadata.hasPart as Prisma.JsonObject[])
                .filter((childData) => childData["@id"] !== this.ocxId)
            }
          }
        });
      }

      // update the new parent
      const updatedParentHasPart = position === 'firstChild' ?
        [this.asPartData as unknown as Prisma.JsonObject, ...(parent.metadata.hasPart as Prisma.JsonObject[])]
        :
        [...(parent.metadata.hasPart as Prisma.JsonObject[]), this.asPartData as unknown as Prisma.JsonObject]
      ;

      await tx.node.update({
        where: { id: parent.prismaNode.id },
        data: {
          metadata: {
            ...parent.metadata,
            hasPart: updatedParentHasPart
          }
        }
      });

      // update the node
      await tx.node.update({
        where: { id: this.prismaNode.id },
        data: {
          metadata: {
            ...this.metadata,
            isPartOf: parent.asPartData as unknown as Prisma.JsonObject,
          },
          parentId: parent.prismaNode.id
        }
      });
    });
  }

  async fixIsPartOf(db: PrismaClient, parent: OcxNode) {
    if (!parent.children.find((child) => child.ocxId === this.ocxId)) {
      throw new Error(`Node ${this.ocxId} is not part of the parent ${parent.ocxId}`);
    }

    await db.node.update({
      where: { id: this.prismaNode.id },
      data: {
        metadata: {
          ...this.metadata,
          isPartOf: parent.asPartData as unknown as Prisma.JsonObject
        },
        parentId: parent.prismaNode.id
      }
    });
  }

  async delete(db: PrismaClient) {
    await db.$transaction(async (tx) => {
      if (this.parent) {
        await tx.node.update({
          where: { id: this.parent.prismaNode.id },
          data: {
            metadata: {
              ...this.parent.metadata,
              hasPart: (this.parent.metadata.hasPart as Prisma.JsonObject[])
                .filter((childData) => childData["@id"] !== this.ocxId)
            }
          }
        });
      }

      for (const child of this.children) {
        await tx.node.update({
          where: { id: child.prismaNode.id },
          data: {
            metadata: {
              ...child.metadata,
              isPartOf: null,
            },
            parentId: null
          }
        });
      }

      await tx.node.delete({
        where: { id: this.prismaNode.id }
      });
    });
  }

  async deleteBranch(db : PrismaClient) {
    // remove from parent if there is one
    // delete the node and all its descendants
    await db.$transaction(async (tx) => {
      if (this.parent) {
        await tx.node.update({
          where: { id: this.parent.prismaNode.id },
          data: {
            metadata: {
              ...this.parent.metadata,
              hasPart: (this.parent.metadata.hasPart as Prisma.JsonObject[])
                .filter((childData) => childData["@id"] !== this.ocxId)
            }
          }
        });
      }

      // find all descendants
      const descendants : OcxNode[] = [this];
      let i = 0;
      while (i < descendants.length) {
        const node = descendants[i];
        descendants.push(...node.children);
        i++;
      }

      // delete all descendants
      const ids = descendants.map((descendant) => descendant.prismaNode.id);

      console.log('ids', ids);

      await tx.node.deleteMany({
        where: { id: { in: ids } }
      });
    });
  }

  async removeChildrenNotFound(db: PrismaClient) {
    const cleanedHasPart = (this.metadata.hasPart as unknown as NodePartData[]).filter((childData) => {
      const ocxId = childData["@id"] as string;
      return !!this.ocxBundle.findNodeByOcxId(ocxId);
    });

    await db.node.update({
      where: { id: this.prismaNode.id },
      data: {
        metadata: {
          ...this.metadata,
          hasPart: cleanedHasPart as unknown as Prisma.JsonObject[]
        }
      }
    });
  }

  async renameProperty(db: PrismaClient, oldName: string, newName: string) {
    const metadata = this.metadata;
    const newMetadata = {...metadata};

    if (metadata[oldName]) {
      newMetadata[newName] = metadata[oldName];
      delete newMetadata[oldName];
    }

    await db.node.update({
      where: { id: this.prismaNode.id },
      data: {
        metadata: newMetadata
      }
    });
  }

  async removeProperty(db: PrismaClient, name: string) {
    const metadata = this.metadata;
    const newMetadata = {...metadata};

    if (metadata[name]) {
      delete newMetadata[name];
    }

    await db.node.update({
      where: { id: this.prismaNode.id },
      data: {
        metadata: newMetadata
      }
    });
  }
}
