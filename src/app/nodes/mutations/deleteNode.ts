import { resolver } from "@blitzjs/rpc";
import db from "db";
import { DeleteNodeSchema } from "../schemas";

export default resolver.pipe(
  resolver.zod(DeleteNodeSchema),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const node = await db.node.deleteMany({ where: { id } });

    return node;
  }
);
