import { resolver } from "@blitzjs/rpc";
import { ExportBundleSchema } from "../schemas";

import boss from "src/app/jobs/pgBoss";

export default resolver.pipe(
  resolver.zod(ExportBundleSchema),
  resolver.authorize(),
  async ({ id, exportDestinationId, ...data }, ctx) => {
    await boss.send("export-bundle", {
      id,
      exportDestinationId,
      userId: ctx.session.userId,
    });

    return { message: "Export operation has been started." };
  }
);
