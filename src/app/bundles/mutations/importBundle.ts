import { resolver } from "@blitzjs/rpc";
import { ImportBundleSchema } from "../schemas";

import db from "db";

import OcxBundle from "@/src/app/lib/OcxBundle"

export default resolver.pipe(
  resolver.zod(ImportBundleSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    const bundle = await db.bundle.findFirst({
      where: { id },
      include: {
        nodes: true
      }
    });

    if (!bundle) throw new Error("Bundle not found");

    const ocxBundle = new OcxBundle(bundle, bundle.nodes);

    await ocxBundle.importFromSitemap(db);

    return ocxBundle.prismaBundle;
  }
);
