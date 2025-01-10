import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getBundleImportSource from "../../queries/getBundleImportSource"
import { EditBundleImportSource } from "../../components/EditBundleImportSource"

type EditBundleImportSourcePageProps = {
  params: { bundleImportSourceId: string }
}

export async function generateMetadata({
  params,
}: EditBundleImportSourcePageProps): Promise<Metadata> {
  const BundleImportSource = await invoke(getBundleImportSource, {
    id: Number(params.bundleImportSourceId),
  })
  return {
    title: `Edit BundleImportSource ${BundleImportSource.id} - ${BundleImportSource.name}`,
  }
}

export default async function Page({ params }: EditBundleImportSourcePageProps) {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditBundleImportSource bundleImportSourceId={Number(params.bundleImportSourceId)} />
      </Suspense>
    </div>
  )
}
