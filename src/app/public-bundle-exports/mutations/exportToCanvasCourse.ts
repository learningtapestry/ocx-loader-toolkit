import { resolver } from "@blitzjs/rpc";
import db from "db";

import boss from "@/src/app/jobs/pgBoss"

import { ExportToCanvasCourseSchema } from "../schemas";

export default resolver.pipe(
  resolver.zod(ExportToCanvasCourseSchema),
  async (input) => {
    const {
      bundleExportId,
      token,
      newCourseName,
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
          existingCourseId
        },
        state: 'pending'
      },
      include: {
        bundle: true,
      },
    })

    await boss.send("export-bundle", {
      bundleExportId: bundleExport.id
    });

    return updatedBundleExport;
  }
);
