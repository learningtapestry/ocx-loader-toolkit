import db from "db";

import Exporter from "src/lib/exporters/Exporter";
import CanvasLegacyOpenSciEdExporter from "src/lib/exporters/CanvasLegacyOpenSciEdExporter";
import CanvasSatchelExporter from "src/lib/exporters/CanvasSatchelExporter";

import boss from "./pgBoss";
import airbrake from "config/airbrake"

export type ExportBundleJobData = {
  bundleExportId: number;
};

export const queueName = "export-bundle";

export async function startWorker() {
  console.log("Starting exportBundleJob worker")

  boss.work<ExportBundleJobData>(queueName, async ([job]) => {
    const { bundleExportId } = job.data;

    console.log(`[${bundleExportId}] Starting export`);

    const bundleExport = (await db.bundleExport.findUnique({
      where: {
        id: bundleExportId
      },
      include: {
        exportDestination: true,
        bundle: true,
      }
    }))!;
    
    const destinationType = bundleExport.exportDestination.type;
    const isCanvasDestination = destinationType === "canvas" || destinationType === "canvas-oauth2" || destinationType === "canvas-oauth2-temp";
    const isSatchelImport = (bundleExport.bundle.importMetadata as Record<string, string>)?.source === "satchel"
    const exporter: Exporter | undefined = isSatchelImport && isCanvasDestination
      ? new CanvasSatchelExporter(bundleExport)
      : isCanvasDestination && !isSatchelImport
        ? new CanvasLegacyOpenSciEdExporter(bundleExport)
        : undefined;

    if (exporter) {
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

export async function enqueueJob(data: ExportBundleJobData) {
  await boss.send(queueName, data);
}

const ExportBundleJob = {
  startWorker,
  queueName,
  enqueueJob,
}

export default ExportBundleJob
