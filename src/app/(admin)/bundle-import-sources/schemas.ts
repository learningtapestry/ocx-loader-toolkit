import { z } from "zod"

export const CreateBundleImportSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.union([
    z.literal(""),
    z.enum(["lcms-legacy-ose", "satchel"])
  ]).refine((val) => val !== "", {
    message: "Import source type is required"
  }),

  baseUrl: z.string().min(1, "Base URL is required"),
  accessData: z.object({
    api_secret_key: z.string().optional(),
    interval_minutes: z.string().default("60").optional(),
  }),
})

export const UpdateBundleImportSourceSchema = CreateBundleImportSourceSchema.merge(
  z.object({
    id: z.number(),
  })
)

export const DeleteBundleImportSourceSchema = z.object({
  id: z.number(),
})

export const ImportFromBundleImportSourceSchema = z.object({
  id: z.number(),
})
