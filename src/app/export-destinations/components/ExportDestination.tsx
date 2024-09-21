"use client"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { useRouter } from "next/navigation"
import deleteExportDestination from "../mutations/deleteExportDestination"
import getExportDestination from "../queries/getExportDestination"

export const ExportDestination = ({ exportDestinationId }: { exportDestinationId: number }) => {
  const router = useRouter()
  const [deleteExportDestinationMutation] = useMutation(deleteExportDestination)
  const [exportDestination] = useQuery(getExportDestination, { id: exportDestinationId })

  return (
    <>
      <div>
        <h1>Project {exportDestination.id}</h1>
        <pre>{JSON.stringify(exportDestination, null, 2)}</pre>

        <Link href={`/export-destinations/${exportDestination.id}/edit`}>Edit</Link>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteExportDestinationMutation({ id: exportDestination.id })
              router.push("/export-destinations")
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
