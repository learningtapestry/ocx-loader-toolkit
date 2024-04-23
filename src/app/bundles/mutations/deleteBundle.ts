import { resolver } from "@blitzjs/rpc";
import db from "db";
import { DeleteBundleSchema } from "../schemas";

export default resolver.pipe(
  resolver.zod(DeleteBundleSchema),
  resolver.authorize(),
  async ({ id }) => {
    const bundle = await db.bundle.deleteMany({ where: { id } });

    return bundle;
  }
);
