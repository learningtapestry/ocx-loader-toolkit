import db from "db";
import CanvasLegacyOpenSciEdExporter from "src/lib/exporters/CanvasLegacyOpenSciEdExporter";
import GoogleClassroomExporter from "src/lib/exporters/GoogleClassroomExporter";

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
      }
    }))!;

    const exportDestinationType = bundleExport.exportDestination.type;

    if (exportDestinationType === "canvas" || exportDestinationType === "canvas-oauth2" || exportDestinationType === "canvas-oauth2-temp") {
      const exporter = new CanvasLegacyOpenSciEdExporter(bundleExport);

      try {
        await exporter.exportAll();

        if (exportDestinationType === "canvas-oauth2-temp") {
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

    } else if (exportDestinationType.startsWith("google-classroom")) {
      const exporter = new GoogleClassroomExporter(bundleExport);

      try {
        await exporter.exportAll();

        if (exportDestinationType === "google-classroom-oauth2-temp") {
          await db.exportDestination.update({
            where: {
              id: bundleExport.exportDestinationId
            },
            data: {
              type: "google-classroom-oauth2-used",
              metadata: {}
            }
          })
        }
      } catch (e) {
        console.error(`[${bundleExport.id}] Error exporting bundle to Google Classroom:`, e);

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
