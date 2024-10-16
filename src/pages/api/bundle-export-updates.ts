import db from "db";
import airbrake from "config/airbrake";

import { createSession } from "better-sse";
import { api } from "src/app/blitz-server";
import { subscribeToBundleExportUpdates } from "src/app/jobs/BundleExportUpdate";

export default api(async (req, res, ctx) => {
  const { bundleExportId } = req.query;

  if (!bundleExportId || typeof bundleExportId !== "string") {
    return res.status(400).json({ message: "Valid bundleExportId is required" });
  }

  const bundleExport = await db.bundleExport.findUnique({
    where: {
      id: parseInt(bundleExportId),
    },
  });

  if (!bundleExport) {
    return res.status(404).json({ message: "Bundle export not found" });
  }

  if (bundleExport.userId && bundleExport.userId !== ctx.session.userId) {
    return res.status(403).json({ message: "You do not have permission to access this bundle export" });
  }

  try {
    const session = await createSession(req, res, {
      keepAlive: 15000 // Set keep-alive interval to 15 seconds
    });

    subscribeToBundleExportUpdates(bundleExportId, (data) => {
      session.push(data);
    });

    req.on("close", () => {
      // Clean up any resources if needed
    });

  } catch (error) {
    console.error("Error in SSE handler:", error);
    airbrake?.notify(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
