import { resolver } from "@blitzjs/rpc";
import { ImportBundleFromZipFileSchema, ImportBundleSchema } from "../schemas"

import db from "db";

import OcxBundle from "src/lib/OcxBundle"

export default resolver.pipe(
  resolver.zod(ImportBundleFromZipFileSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    const bundle = await db.bundle.findFirst({
      where: { id },
      include: {
        nodes: true
      }
    });

    if (!bundle) throw new Error("Bundle not found");

    const ocxBundle: OcxBundle = new OcxBundle(bundle, bundle.nodes);

    const base64Data = data.zipDataUrl.split("base64,")[1];
    const buffer = Buffer.from(base64Data, 'base64');

    await ocxBundle.importFromZipFile(db, buffer, true);

    return ocxBundle.prismaBundle;
  }
);
