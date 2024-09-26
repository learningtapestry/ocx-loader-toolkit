import { z } from "zod"

export const CreateExportDestinationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  baseUrl: z.string().url("Invalid URL format"),
  metadata: z.any()
})

export const UpdateExportDestinationSchema = CreateExportDestinationSchema.extend({
  id: z.number(),
}).partial()

export const DeleteExportDestinationSchema = z.object({
  id: z.number(),
})
