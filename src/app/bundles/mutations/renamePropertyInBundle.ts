import { resolver } from "@blitzjs/rpc";
import { RenamePropertyInBundleSchema } from "../schemas";

import db from "db";

import OcxBundle from "src/lib/OcxBundle"

export default resolver.pipe(
  resolver.zod(RenamePropertyInBundleSchema),
  resolver.authorize(),
  async ({ id, oldName, newName, nodeType }) => {
    const bundle = await db.bundle.findFirst({
      where: { id },
      include: {
        nodes: true
      }
    });

    if (!bundle) throw new Error("Bundle not found");

    const ocxBundle = new OcxBundle(bundle, bundle.nodes);

    await ocxBundle.renameProperty(db, oldName, newName, nodeType);

    return ocxBundle.prismaBundle;
  }
);
