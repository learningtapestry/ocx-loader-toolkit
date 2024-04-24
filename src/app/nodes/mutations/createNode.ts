import { resolver } from "@blitzjs/rpc";
import db from "db";
import { CreateNodeSchema } from "../schemas";

export default resolver.pipe(
  resolver.zod(CreateNodeSchema),
  resolver.authorize(),
  async (input) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const node = await db.node.create({ data: input });

    return node;
  }
);
