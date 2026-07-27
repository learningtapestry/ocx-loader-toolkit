import { resolver } from "@blitzjs/rpc";
import { ImportLegacyOSEUnitSchema } from "../schemas"

import db from "db";

import OpenSciEdLegacyOcxBundle from "src/lib/LegacyOpenSciEdOcxBundle"
import { IMPORT_TRANSACTION_OPTIONS } from "src/lib/db/DbClient"

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

    const ocxBundle = new OpenSciEdLegacyOcxBundle(bundle, []);

    const unitText = await ocxBundle.fetchUnitHtml(data.unitUrl);
    ocxBundle.validateUnitHtml(unitText);

    const updatedBundle = await db.$transaction(async (tx) => {
      await ocxBundle.importNodesFromUnitText(tx, unitText);

      return tx.bundle.findFirst({
        where: { id: bundle.id },
        include: { nodes: true },
      });
    }, IMPORT_TRANSACTION_OPTIONS);

    if (!updatedBundle) {
      throw new Error("Bundle not found after import");
    }

    return updatedBundle;
  }
);
