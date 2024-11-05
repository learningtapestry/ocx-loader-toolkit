import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { BundleImportSourcesList } from "./components/BundleImportSourcesList"

export const metadata: Metadata = {
  title: "BundleImportSources",
  description: "List of bundleImportSources",
}

export default function Page() {
  return (
    <div>
      <p>
        <Link href={"/bundle-import-sources/new"}>Create BundleImportSource</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <BundleImportSourcesList />
      </Suspense>
    </div>
  )
}
