import { resolver } from "@blitzjs/rpc";
import db from "db";

import { ExportToCanvasCourseSchema } from "../schemas";

import ExportBundleJob from "@/src/app/jobs/exportBundleJob"

export default resolver.pipe(
  resolver.zod(ExportToCanvasCourseSchema),
  async (input) => {
    const {
      bundleExportId,
      token,
      newCourseName,
      newCourseCode,
      existingCourseId
    } = input;

    const bundleExport = await db.bundleExport.findFirst(
      {
        where: { id: bundleExportId },
      }
    );

    if (!bundleExport || bundleExport.token !== token) {
      throw new Error("Invalid token");
    }

    const updatedBundleExport = await db.bundleExport.update({
      where: { id: bundleExportId },
      data: {
        metadata: {
          ...bundleExport.metadata as any,
          newCourseName,
          newCourseCode,
          existingCourseId
        },
        state: 'pending'
      },
      include: {
        bundle: true,
      },
    })

    await ExportBundleJob.enqueueJob({
      bundleExportId: bundleExport.id
    })

    return updatedBundleExport;
  }
);
