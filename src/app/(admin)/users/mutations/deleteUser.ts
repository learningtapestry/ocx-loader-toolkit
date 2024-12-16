import { resolver } from "@blitzjs/rpc";
import db from "db";
import { DeleteUserSchema } from "../schemas";

export default resolver.pipe(
  resolver.zod(DeleteUserSchema),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const user = await db.user.deleteMany({ where: { id } });

    return user;
  }
);
