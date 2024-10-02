"use client"
import { Suspense } from "react"
import updateCanvasInstance from "../mutations/updateCanvasInstance"
import getCanvasInstance from "../queries/getCanvasInstance"
import { UpdateCanvasInstanceSchema } from "../schemas"
import { FORM_ERROR, CanvasInstanceForm } from "./CanvasInstanceForm"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"

export const EditCanvasInstance = ({ canvasInstanceId }: { canvasInstanceId: number }) => {
  const [canvasInstance, { setQueryData }] = useQuery(
    getCanvasInstance,
    { id: canvasInstanceId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  )
  const [updateCanvasInstanceMutation] = useMutation(updateCanvasInstance)
  const router = useRouter()
  return (
    <>
      <div>
        <h1>Edit CanvasInstance {canvasInstance.id}</h1>
        <pre>{JSON.stringify(canvasInstance, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <CanvasInstanceForm
            submitText="Update CanvasInstance"
            schema={UpdateCanvasInstanceSchema}
            initialValues={canvasInstance}
            onSubmit={async (values) => {
              try {
                const updated = await updateCanvasInstanceMutation({
                  ...values,
                  id: canvasInstance.id,
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
