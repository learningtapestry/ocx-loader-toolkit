import { resolver } from "@blitzjs/rpc";
import { ImportLegacyOSEUnitSchema } from "../schemas"

import db from "db";

import OpenSciEdLegacyOcxBundle from "src/app/lib/LegacyOpenSciEdOcxBundle"

export default resolver.pipe(
  resolver.zod(ImportLegacyOSEUnitSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    const bundle = await db.bundle.findFirst({
      where: { id },
      include: {
        nodes: true
      }
    });

    if (!bundle) throw new Error("Bundle not found");

    const ocxBundle: OpenSciEdLegacyOcxBundle = new OpenSciEdLegacyOcxBundle(bundle, bundle.nodes);

    await ocxBundle.createNodesFromUnitHtml(db, data.unitUrl);

    return ocxBundle.prismaBundle;
  }
);
