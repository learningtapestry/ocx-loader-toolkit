import db from "db";

import { resolver } from "@blitzjs/rpc";
import { ExportBundleSchema } from "../schemas";

import boss from "src/app/jobs/pgBoss";
import { BundleExport } from "@prisma/client"

export default resolver.pipe(
  resolver.zod(ExportBundleSchema),
  resolver.authorize(),
  async ({ id, exportDestinationId, ...data }, ctx) : Promise<BundleExport> => {
    const bundleExport = await db.bundleExport.create({
      data: {
        name: "Exporting bundle",
        metadata: {
          courseCode: "test1",
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

    await boss.send("export-bundle", {
      bundleExportId: bundleExport.id
    });

    return bundleExport;
  }
);
