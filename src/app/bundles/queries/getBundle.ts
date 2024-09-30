import { NotFoundError } from "blitz";
import { resolver } from "@blitzjs/rpc";
import db from "db";
import { z } from "zod";

const GetBundle = z.object({
  // This accepts type of undefined, but is required at runtime
  id: z.number().optional().refine(Boolean, "Required"),
});

export default resolver.pipe(
  resolver.zod(GetBundle),
  resolver.authorize(),
  async ({ id }) => {
    const bundle = await db.bundle.findFirst({
      where: { id },
      include: {
        nodes: true,
        exports: true,
      }
    });

    if (!bundle) throw new NotFoundError();

    return bundle;
  }
);
