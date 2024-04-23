import { resolver } from "@blitzjs/rpc";
import db from "db";
import { CreateBundleSchema } from "../schemas";

export default resolver.pipe(
  resolver.zod(CreateBundleSchema),
  resolver.authorize(),
  async (input) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const bundle = await db.bundle.create({ data: input });

    return bundle;
  }
);
