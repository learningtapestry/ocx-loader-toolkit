import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getBundleImportSource from "../queries/getBundleImportSource"
import { BundleImportSource } from "../components/BundleImportSource"

export async function generateMetadata({ params }: BundleImportSourcePageProps): Promise<Metadata> {
  const BundleImportSource = await invoke(getBundleImportSource, {
    id: Number(params.bundleImportSourceId),
  })
  return {
    title: `BundleImportSource ${BundleImportSource.id} - ${BundleImportSource.name}`,
  }
}

type BundleImportSourcePageProps = {
  params: { bundleImportSourceId: string }
}

export default async function Page({ params }: BundleImportSourcePageProps) {
  return (
    <div>
      <p>
        <Link href={"/bundle-import-sources"}>BundleImportSources</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <BundleImportSource bundleImportSourceId={Number(params.bundleImportSourceId)} />
      </Suspense>
    </div>
  )
}
