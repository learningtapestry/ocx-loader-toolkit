import { z } from "zod";

export const ExportToCanvasNewCourseSchema = z.object({
  bundleExportId: z.number(),
  token: z.string(),
  courseName: z.string(),
});
