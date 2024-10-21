import { z } from "zod";

export const ExportToCanvasCourseSchema = z.object({
  bundleExportId: z.number(),
  token: z.string(),
  newCourseName: z.string().optional(),
  existingCourseId: z.number().optional(),
});
