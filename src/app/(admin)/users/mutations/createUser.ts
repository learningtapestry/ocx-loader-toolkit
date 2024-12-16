import { resolver } from "@blitzjs/rpc";
import db from "db";
import { CreateUserSchema } from "../schemas";

export default resolver.pipe(
  resolver.zod(CreateUserSchema),
  resolver.authorize(),
  async (input) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const user = await db.user.create({ data: input });

    return user;
  }
);
