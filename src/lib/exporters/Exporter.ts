import { BundleExport } from "@prisma/client";

export default class Exporter {
  prismaBundleExport: BundleExport;

  constructor(prismaBundleExport: BundleExport) {
    this.prismaBundleExport = prismaBundleExport;
  }

  async exportAll(): Promise<string | null> {
    throw new Error("Not implemented");
  }
}