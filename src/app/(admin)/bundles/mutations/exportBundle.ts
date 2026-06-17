import db from "db";

import { resolver } from "@blitzjs/rpc";
import { ExportBundleSchema } from "../schemas";

import ExportBundleJob from "src/app/jobs/exportBundleJob"

import { BundleExport } from "@prisma/client"
import { JsonObject } from "type-fest";

export default resolver.pipe(
  resolver.zod(ExportBundleSchema),
  resolver.authorize(),
  async ({ id, exportDestinationId, ...data }, ctx) : Promise<BundleExport> => {
    const bundle = await db.bundle.findUnique({ where: { id } });
    const importMetadata = (bundle?.importMetadata ?? {}) as JsonObject;
    const courseName =
      (importMetadata.full_course_name as string | undefined) ||
      bundle?.name ||
      "Exported bundle";

    const bundleExport = await db.bundleExport.create({
      data: {
        name: "Exporting bundle",
        metadata: {
          courseCode: "test1",
          courseName,
          newCourseName: courseName,
          language: "en",
        },
        bundle: {
          connect: {
            id,
          },
        },
        exportDestination: {
          connect: {
            id: exportDestinationId,
          },
        },
        user: {
          connect: {
            id: ctx.session.userId,
          },
        },
      },
    });

    await ExportBundleJob.enqueueJob({
      bundleExportId: bundleExport.id
    })

    return bundleExport;
  }
);
