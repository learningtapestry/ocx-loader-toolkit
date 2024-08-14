import { NodeExport as PrismaNodeExport } from '@prisma/client';

export default class OcxNodeExport {
  prismaNodeExport: PrismaNodeExport;

  constructor(prismaNodeExport: PrismaNodeExport) {
    this.prismaNodeExport = prismaNodeExport;
  }
}
