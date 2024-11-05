import { NotFoundError } from "blitz";
import { resolver } from "@blitzjs/rpc";
import db from "db";
import { z } from "zod";
import CanvasRepository from "src/lib/exporters/repositories/CanvasRepository"
import { Prisma } from "@prisma/client"

const GetCanvasCourses = z.object({
  // This accepts type of undefined, but is required at runtime
  bundleExportId: z.number().optional().refine(Boolean, "Required"),
});

export default resolver.pipe(
  resolver.zod(GetCanvasCourses),
  async ({ bundleExportId }) => {
    const bundleExport = await db.bundleExport.findFirst({
      where: { id: bundleExportId },
      include: {
        exportDestination: true,
      },
    });

    if (!bundleExport) throw new NotFoundError();

    const canvasRepository = new CanvasRepository({
      baseUrl: bundleExport.exportDestination.baseUrl,
      accessToken: (bundleExport.exportDestination.metadata! as Prisma.JsonObject).accessToken as string
    });

    return canvasRepository.getCourses();
  }
);
