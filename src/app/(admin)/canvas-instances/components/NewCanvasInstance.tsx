"use client"
import { FORM_ERROR, CanvasInstanceForm } from "./CanvasInstanceForm"
import { CreateCanvasInstanceSchema } from "../schemas"
import { useMutation } from "@blitzjs/rpc"
import createCanvasInstance from "../mutations/createCanvasInstance"
import { useRouter } from "next/navigation"

export function New__ModelName() {
  const [createCanvasInstanceMutation] = useMutation(createCanvasInstance)
  const router = useRouter()
  return (
    <CanvasInstanceForm
      submitText="Create CanvasInstance"
      schema={CreateCanvasInstanceSchema}
      onSubmit={async (values) => {
        try {
          const canvasInstance = await createCanvasInstanceMutation(values)
          router.push(`/canvas-instances/${canvasInstance.id}`)
        } catch (error: any) {
          console.error(error)
          return {
            [FORM_ERROR]: error.toString(),
          }
        }
      }}
    />
  )
}
