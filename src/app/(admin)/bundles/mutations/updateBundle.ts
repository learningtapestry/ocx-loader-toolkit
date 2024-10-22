import { resolver } from "@blitzjs/rpc";
import db from "db";
import { UpdateBundleSchema } from "../schemas";

export default resolver.pipe(
  resolver.zod(UpdateBundleSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    const bundle = await db.bundle.update({ where: { id }, data });

    return bundle;
  }
);
