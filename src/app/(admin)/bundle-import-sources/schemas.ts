import { z } from "zod"

export const CreateBundleImportSourceSchema = z.object({
  name: z.string(),
  type: z.string(),

  baseUrl: z.string(),
  accessData: z.object({
    api_secret_key: z.string(),
  })
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
