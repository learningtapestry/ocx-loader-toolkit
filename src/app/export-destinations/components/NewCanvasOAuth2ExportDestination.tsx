"use client"
import { CanvasOAuth2Form } from "./CanvasOAuth2Form"
import { useMutation } from "@blitzjs/rpc"
import generateCanvasOAuth2ExportDestinationUrl from "../mutations/generateCanvasOAuth2ExportDestinationUrl"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "src/app/components/Form"
import { CanvasOAuth2ExportDestinationSchema } from "src/app/export-destinations/schemas"

export function NewCanvasOAuth2ExportDestination() {
  const [generateCanvasOAuth2ExportDestinationUrlMutation] = useMutation(generateCanvasOAuth2ExportDestinationUrl)
  const router = useRouter()

  return (
    <CanvasOAuth2Form
      submitText="Connect to Canvas"
      schema={CanvasOAuth2ExportDestinationSchema}
      onSubmit={async (values) => {
        const baseUrl = window.location.origin;

        const processedValues = {
          ...values,
          canvasInstanceId: parseInt(values.canvasInstanceId as string, 10),
          baseUrl
        }

        try {
          const authUrl = await generateCanvasOAuth2ExportDestinationUrlMutation(processedValues)
          window.location.href = authUrl
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
