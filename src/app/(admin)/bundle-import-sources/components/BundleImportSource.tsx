"use client"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { useRouter } from "next/navigation"
import deleteBundleImportSource from "../mutations/deleteBundleImportSource"
import importFromBundleImportSource from "../mutations/importFromBundleImportSource"
import getBundleImportSource from "../queries/getBundleImportSource"

export const BundleImportSource = ({ bundleImportSourceId }: { bundleImportSourceId: number }) => {
  const router = useRouter()
  const [deleteBundleImportSourceMutation] = useMutation(deleteBundleImportSource)
  const [importFromBundleImportSourceMutation] = useMutation(importFromBundleImportSource)
  const [bundleImportSource] = useQuery(getBundleImportSource, { id: bundleImportSourceId })

  return (
    <>
      <div>
        <h1>BundleImportSource {bundleImportSource.id}</h1>
        <pre>{JSON.stringify(bundleImportSource, null, 2)}</pre>

        <Link href={`/bundle-import-sources/${bundleImportSource.id}/edit`}>Edit</Link>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteBundleImportSourceMutation({ id: bundleImportSource.id })
              router.push("/bundle-import-sources")
            }
          }}
          style={{ marginLeft: "0.5rem" }}
        >
          Delete
        </button>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will import all bundles from the source")) {
              const bundles = await importFromBundleImportSourceMutation({ id: bundleImportSource.id })

              if (bundles) {
                alert(`Created ${bundles} import jobs`)
              }
            }
          }}
          style={{ marginLeft: "0.5rem" }}
        >
          Sync All
        </button>

      </div>
    </>
  )
}
