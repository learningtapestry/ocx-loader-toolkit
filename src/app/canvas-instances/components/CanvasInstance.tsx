"use client"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { useRouter } from "next/navigation"
import deleteCanvasInstance from "../mutations/deleteCanvasInstance"
import getCanvasInstance from "../queries/getCanvasInstance"

export const CanvasInstance = ({ canvasInstanceId }: { canvasInstanceId: number }) => {
  const router = useRouter()
  const [deleteCanvasInstanceMutation] = useMutation(deleteCanvasInstance)
  const [canvasInstance] = useQuery(getCanvasInstance, { id: canvasInstanceId })

  return (
    <>
      <div>
        <h1>Canvas Instance {canvasInstance.name}</h1>
        <pre>{JSON.stringify(canvasInstance, null, 2)}</pre>

        <Link href={`/canvas-instances/${canvasInstance.id}/edit`}>Edit</Link>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteCanvasInstanceMutation({ id: canvasInstance.id })
              router.push("/canvas-instances")
            }
          }}
          style={{ marginLeft: "0.5rem" }}
        >
          Delete
        </button>
      </div>
    </>
  )
}
