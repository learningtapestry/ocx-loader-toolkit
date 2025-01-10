"use client"
import { FORM_ERROR, BundleImportSourceForm } from "./BundleImportSourceForm"
import { CreateBundleImportSourceSchema } from "../schemas"
import { useMutation } from "@blitzjs/rpc"
import createBundleImportSource from "../mutations/createBundleImportSource"
import { useRouter } from "next/navigation"

export function New__ModelName() {
  const [createBundleImportSourceMutation] = useMutation(createBundleImportSource)
  const router = useRouter()
  return (
    <BundleImportSourceForm
      submitText="Create BundleImportSource"
      schema={CreateBundleImportSourceSchema}
      onSubmit={async (values) => {
        try {
          const bundleImportSource = await createBundleImportSourceMutation(values)
          router.push(`/bundle-import-sources/${bundleImportSource.id}`)
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
