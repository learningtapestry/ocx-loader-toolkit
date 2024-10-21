import { resolver } from "@blitzjs/rpc";
import db from "db";
import { ExportToCanvasNewCourseSchema } from "../schemas";
import boss from "@/src/app/jobs/pgBoss"

export default resolver.pipe(
  resolver.zod(ExportToCanvasNewCourseSchema),
  async (input) => {
    const { bundleExportId, token, courseName } = input;

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
          courseName,
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
