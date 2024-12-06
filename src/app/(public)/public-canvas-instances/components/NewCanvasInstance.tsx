"use client"
import { FORM_ERROR, CanvasInstanceForm } from "./CanvasInstanceForm"
import { CreateCanvasInstanceSchema } from "../schemas"
import { useMutation } from "@blitzjs/rpc"
import createCanvasInstance from "../mutations/createPublicCanvasInstance"

export function New__ModelName() {
  const [createCanvasInstanceMutation] = useMutation(createCanvasInstance)
  return (
    <CanvasInstanceForm
      submitText="Create/Update Connection to my Canvas Instance"
      schema={CreateCanvasInstanceSchema}
      onSubmit={async (values) => {
        try {
          const { message, status } = await createCanvasInstanceMutation(values)

          if (status === 'error') {
            return {
              [FORM_ERROR]: message,
            }
          }

          window.alert(message);
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
