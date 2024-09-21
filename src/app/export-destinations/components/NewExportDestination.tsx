"use client"
import { ExportDestinationForm } from "./ExportDestinationForm"
import { CreateExportDestinationSchema } from "../schemas"
import { useMutation } from "@blitzjs/rpc"
import createExportDestination from "../mutations/createExportDestination"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/app/components/Form"

export function New__ModelName() {
  const [createExportDestinationMutation] = useMutation(createExportDestination)
  const router = useRouter()
  return (
    <ExportDestinationForm
      submitText="Create ExportDestination"
      schema={CreateExportDestinationSchema}
      onSubmit={async (values) => {
        try {
          const exportDestination = await createExportDestinationMutation(values)
          router.push(`/export-destinations/${exportDestination.id}`)
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
