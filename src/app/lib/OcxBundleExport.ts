import db from "@/db/index"

import {
  BundleExport as PrismaBundleExport,
  ExportDestination as PrismaExportDestination, Prisma,
} from "@prisma/client"

import CanvasRepository from "@/src/app/lib/exporters/repositories/CanvasRepository"

export default class OcxBundleExport {
  prismaBundleExport: PrismaBundleExport;
  exportDestination?: PrismaExportDestination;
  canvasRepository?: CanvasRepository;

  initPromise?: Promise<String>;

  constructor(prismaBundleExport: PrismaBundleExport) {
    this.prismaBundleExport = prismaBundleExport;

    this.initPromise = this.init();
  }

  async init() {
    this.exportDestination ||= await db.exportDestination.findFirst({
      where: {
        id: this.prismaBundleExport.exportDestinationId
      }
    }) as PrismaExportDestination;

    this.canvasRepository ||= new CanvasRepository({
      baseUrl: this.exportDestination.baseUrl,
      accessToken: (this.exportDestination.metadata! as Prisma.JsonObject).token as string
    });

    return 'initialized';
  }
}

