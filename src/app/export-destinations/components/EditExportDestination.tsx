"use client"
import { Suspense } from "react"
import updateExportDestination from "../mutations/updateExportDestination"
import getExportDestination from "../queries/getExportDestination"
import { UpdateExportDestinationSchema } from "../schemas"
import { ExportDestinationForm } from "./ExportDestinationForm"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/app/components/Form"

export const EditExportDestination = ({ exportDestinationId }: { exportDestinationId: number }) => {
  const [exportDestination, { setQueryData }] = useQuery(
    getExportDestination,
    { id: exportDestinationId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  )
  const [updateExportDestinationMutation] = useMutation(updateExportDestination)
  const router = useRouter()

  const exportDestinationWithStringifiedMetadata = {
    ...exportDestination,
    metadata: JSON.stringify(exportDestination.metadata, null, 2),
  }

  return (
    <>
      <div>
        <h1>Edit ExportDestination {exportDestination.id}</h1>
        <pre>{JSON.stringify(exportDestination, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <ExportDestinationForm
            submitText="Update ExportDestination"
            schema={UpdateExportDestinationSchema}
            initialValues={exportDestinationWithStringifiedMetadata}
            onSubmit={async (values) => {
              try {
                const updated = await updateExportDestinationMutation({
                  ...values,
                  id: exportDestination.id,
                })
                await setQueryData(updated)
                router.refresh()
              } catch (error: any) {
                console.error(error)
                return {
                  [FORM_ERROR]: error.toString(),
                }
              }
            }}
          />
        </Suspense>
      </div>
    </>
  )
}
