import { resolver } from "@blitzjs/rpc";
import { ExportBundleSchema } from "../schemas";

import db from "db";

import OcxBundle from "@/src/app/lib/OcxBundle";
import CanvasLegacyOpenSciEdExporter from "@/src/app/lib/exporters/CanvasLegacyOpenSciEdExporter";

export default resolver.pipe(
  resolver.zod(ExportBundleSchema),
  resolver.authorize(),
  async ({ id, exportDestinationId, ...data }, ctx) => {
    const bundle = await db.bundle.findFirst({
      where: { id },
      include: {
        nodes: true
      }
    });

    if (!bundle) throw new Error("Bundle not found");

    const exportDestination = await db.exportDestination.findFirst({
      where: { id: exportDestinationId },
    });

    if (!exportDestination) throw new Error("Export destination not found");

    const ocxBundle = new OcxBundle(bundle, bundle.nodes);

    const user = await db.user.findFirst({
      where: { id: ctx.session.userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (exportDestination.type === "canvas") {

      const exporter = new CanvasLegacyOpenSciEdExporter(
        exportDestination,
        ocxBundle,
        user
      );

      return await exporter.exportAll();
    } else {
      // TODO: Implement exporting to other export destinations

      throw new Error("Export destination not supported");
    }
  }
);
