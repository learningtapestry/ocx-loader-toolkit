import { resolver } from "@blitzjs/rpc";
import { RemovePropertyInBundleSchema, RenamePropertyInBundleSchema } from "../schemas"

import db from "db";

import OcxBundle from "src/app/lib/OcxBundle"

export default resolver.pipe(
  resolver.zod(RemovePropertyInBundleSchema),
  resolver.authorize(),
  async ({ id, name, nodeType }) => {
    const bundle = await db.bundle.findFirst({
      where: { id },
      include: {
        nodes: true
      }
    });

    if (!bundle) throw new Error("Bundle not found");

    const ocxBundle = new OcxBundle(bundle, bundle.nodes);

    await ocxBundle.removeProperty(db, name, nodeType);

    return ocxBundle.prismaBundle;
  }
);
