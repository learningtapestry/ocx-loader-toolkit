import db from "db";
import CanvasLegacyOpenSciEdExporter from "src/app/lib/exporters/CanvasLegacyOpenSciEdExporter";

import boss from "./pgBoss";

export type ExportBundleJobData = {
  bundleExportId: number;
};

export async function initPgBoss() {
  await boss.start();
  await boss.createQueue('export-bundle')
}

export async function startWorkers() {
  await initPgBoss();

  console.log("Starting workers");

  boss.work<ExportBundleJobData>("export-bundle", async ([job]) => {
    const { bundleExportId } = job.data;

    const bundleExport = (await db.bundleExport.findUnique({
      where: {
        id: bundleExportId
      },
      include: {
        exportDestination: true,
      }
    }))!;

    if (bundleExport.exportDestination.type === "canvas" || bundleExport.exportDestination.type === "canvas-oauth2") {
      const exporter = new CanvasLegacyOpenSciEdExporter(bundleExport);

      await exporter.exportAll();
    } else {
      throw new Error("Export destination not supported");
    }
  });
}
