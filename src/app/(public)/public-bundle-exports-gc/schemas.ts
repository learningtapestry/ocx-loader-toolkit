import { z } from "zod";

export const ExportToGoogleClassroomCourseSchema = z.object({
  bundleExportId: z.number(),
  token: z.string(),
  newCourseName: z.string().min(1),
});
