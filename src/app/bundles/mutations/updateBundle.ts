import { resolver } from "@blitzjs/rpc";
import db from "db";
import { UpdateBundleSchema } from "../schemas";

export default resolver.pipe(
  resolver.zod(UpdateBundleSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const bundle = await db.bundle.update({ where: { id }, data });

    return bundle;
  }
);
