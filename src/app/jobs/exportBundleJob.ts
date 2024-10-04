import db from "db";
import OcxBundle from "src/app/lib/OcxBundle";
import CanvasLegacyOpenSciEdExporter from "src/app/lib/exporters/CanvasLegacyOpenSciEdExporter";

import boss from "./pgBoss";

type ExportBundleJobData = {
  id: number;
  exportDestinationId: number;
  userId: number;
};

export async function startWorkers() {
  await boss.start();

  await boss.createQueue('export-bundle')

  console.log("Starting workers");

  boss.work<ExportBundleJobData>("export-bundle", async ([job]) => {
    const { id, exportDestinationId, userId } = job.data;

    const bundle = await db.bundle.findFirst({
      where: { id },
      include: {
        nodes: true,
      },
    });

    if (!bundle) throw new Error("Bundle not found");

    const exportDestination = await db.exportDestination.findFirst({
      where: { id: exportDestinationId },
    });

    if (!exportDestination) throw new Error("Export destination not found");

    const ocxBundle = new OcxBundle(bundle, bundle.nodes);

    const user = await db.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (exportDestination.type === "canvas" || exportDestination.type === "canvas-oauth2") {
      const exporter = new CanvasLegacyOpenSciEdExporter(
        exportDestination,
        ocxBundle,
        user
      );

      await exporter.exportAll();
    } else {
      throw new Error("Export destination not supported");
    }
  });
}
