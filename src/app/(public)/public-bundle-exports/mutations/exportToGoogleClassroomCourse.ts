import { resolver } from "@blitzjs/rpc";
import db from "db";

import { ExportToGoogleClassroomCourseSchema } from "../schemas";

import ExportBundleJob from "@/src/app/jobs/exportBundleJob"

export default resolver.pipe(
  resolver.zod(ExportToGoogleClassroomCourseSchema),
  async (input) => {
    const { bundleExportId, token } = input;

    const bundleExport = await db.bundleExport.findFirst({
      where: { id: bundleExportId },
    });

    if (!bundleExport || bundleExport.token !== token) {
      throw new Error("Invalid token");
    }

    const updatedBundleExport = await db.bundleExport.update({
      where: { id: bundleExportId },
      data: {
        state: "pending",
      },
      include: {
        bundle: true,
        exportDestination: true,
      },
    })

    await ExportBundleJob.enqueueJob({
      bundleExportId: bundleExport.id,
    })

    return updatedBundleExport;
  }
);
