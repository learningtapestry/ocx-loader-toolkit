import { resolver } from "@blitzjs/rpc";
import db from "db";
import { UpdateNodeSchema } from "../schemas";

export default resolver.pipe(
  resolver.zod(UpdateNodeSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const node = await db.node.update({ where: { id }, data });

    return node;
  }
);
