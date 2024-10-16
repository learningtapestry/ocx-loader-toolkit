import { NotFoundError } from "blitz";
import { resolver } from "@blitzjs/rpc";
import db from "db";
import { z } from "zod";

const GetPublicBundleExport = z.object({
  // This accepts type of undefined, but is required at runtime
  id: z.number().optional().refine(Boolean, "Required"),
});

export default resolver.pipe(
  resolver.zod(GetPublicBundleExport),
  async ({ id }) => {
    const bundleExport = await db.bundleExport.findFirst({
      where: { id },
      include: {
        bundle: true,
      },
    });

    if (!bundleExport) throw new NotFoundError();

    return bundleExport;
  }
);
