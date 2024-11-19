"use client"
import { Suspense } from "react"
import updateBundleImportSource from "../mutations/updateBundleImportSource"
import getBundleImportSource from "../queries/getBundleImportSource"
import { UpdateBundleImportSourceSchema } from "../schemas"
import { FORM_ERROR, BundleImportSourceForm } from "./BundleImportSourceForm"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"

export const EditBundleImportSource = ({
  bundleImportSourceId,
}: {
  bundleImportSourceId: number
}) => {
  const [bundleImportSource, { setQueryData }] = useQuery(
    getBundleImportSource,
    { id: bundleImportSourceId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  )
  const [updateBundleImportSourceMutation] = useMutation(updateBundleImportSource)
  const router = useRouter()
  return (
    <>
      <div>
        <h1>Edit BundleImportSource {bundleImportSource.id}</h1>
        <pre>{JSON.stringify(bundleImportSource, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <BundleImportSourceForm
            submitText="Update BundleImportSource"
            schema={UpdateBundleImportSourceSchema}
            initialValues={bundleImportSource as any}
            onSubmit={async (values) => {
              try {
                const updated = await updateBundleImportSourceMutation({
                  ...values,
                  id: bundleImportSource.id,
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
