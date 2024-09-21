import { z } from "zod"

// Custom validator to accept either a JSON string or a JSON object - this is necessary because the validation
// is applied both at the front end and back end, and the JSON object is serialized to a string when sent to the server
const JSONStringOrObject = z.preprocess((val) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val)
    } catch {
      // Return the original value to trigger a validation error
      return val
    }
  }
  return val
}, z.record(z.unknown()).refine((data) => {
  // Additional optional validation can be added here
  return true // Currently accepts any JSON object
}, {
  message: "Invalid JSON object",
}))

export const CreateExportDestinationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  baseUrl: z.string().url("Invalid URL format"),
  metadata: JSONStringOrObject,
})

export const UpdateExportDestinationSchema = CreateExportDestinationSchema.merge(
  z.object({
    id: z.number(),
    name: z.string().min(1, "Name is required").optional(),
    type: z.string().min(1, "Type is required").optional(),
    baseUrl: z.string().url("Invalid URL format").optional(),
    metadata: JSONStringOrObject.optional(),
  })
)

export const DeleteExportDestinationSchema = z.object({
  id: z.number(),
})
