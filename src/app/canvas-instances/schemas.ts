import { z } from "zod"

export const CreateCanvasInstanceSchema = z.object({
  name: z.string(),
  baseUrl: z.string().url(),
  clientId: z.string(),
  clientSecret: z.string(),
})

export const UpdateCanvasInstanceSchema = CreateCanvasInstanceSchema.merge(
  z.object({
    id: z.number(),
  })
)

export const DeleteCanvasInstanceSchema = z.object({
  id: z.number(),
})
