import db from "db";
import CanvasLegacyOpenSciEdExporter from "src/lib/exporters/CanvasLegacyOpenSciEdExporter";

import boss from "./pgBoss";
import airbrake from "config/airbrake"

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

    console.log(`[${bundleExportId}] Starting export`);

    const bundleExport = (await db.bundleExport.findUnique({
      where: {
        id: bundleExportId
      },
      include: {
        exportDestination: true,
      }
    }))!;

    if (bundleExport.exportDestination.type === "canvas" || bundleExport.exportDestination.type === "canvas-oauth2" || bundleExport.exportDestination.type === "canvas-oauth2-temp") {
      const exporter = new CanvasLegacyOpenSciEdExporter(bundleExport);

      try {
        await exporter.exportAll();

        if (bundleExport.exportDestination.type === "canvas-oauth2-temp") {
          // remove the access token and refresh token from the export destination after use
          await db.exportDestination.update({
            where: {
              id: bundleExport.exportDestinationId
            },
            data: {
              type: 'canvas-oauth2-used',
              metadata: {}
            }
          })
        }
      } catch (e) {
        console.error(`[${bundleExport.id}] Error exporting bundle:`, e);

        await airbrake?.notify(e);

        throw e;
      }

    } else {
      throw new Error("Export destination not supported");
    }
  });
}
