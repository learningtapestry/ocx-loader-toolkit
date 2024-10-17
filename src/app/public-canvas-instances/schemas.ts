import { z } from "zod"

export const CreateCanvasInstanceSchema = z.object({
  baseUrl: z.string().url(),
  clientId: z.string(),
  clientSecret: z.string(),
  localBaseUrl: z.string().url(),
})

