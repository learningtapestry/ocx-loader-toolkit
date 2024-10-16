import { resolver } from "@blitzjs/rpc";
import db from "db";

export default resolver.pipe(
  resolver.authorize(),
  async () => {
    const exportDestinations = await db.exportDestination.findMany({
      where: {
        type: {
          in: ["canvas", "canvas-oauth2"]
        }
      }
    });

    return exportDestinations;
  }
);

