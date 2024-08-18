import { NodeExport as PrismaNodeExport, Prisma } from '@prisma/client';

export default class OcxNodeExport {
  prismaNodeExport: PrismaNodeExport;

  constructor(prismaNodeExport: PrismaNodeExport) {
    this.prismaNodeExport = prismaNodeExport;
  }

  get metadata() {
    return this.prismaNodeExport.metadata as Prisma.JsonObject;
  }

  get canvasId() {
    return this.metadata.id as number;
  }
}
