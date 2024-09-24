import { resolver } from "@blitzjs/rpc";
import db from "db";

export default resolver.pipe(
  resolver.authorize(),
  async () => {
    // Assuming "ExportDestination" is the name of your model
    const exportDestinations = await db.exportDestination.findMany();

    return exportDestinations;
  }
);

