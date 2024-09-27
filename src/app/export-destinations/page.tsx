import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ExportDestinationsList } from "./components/ExportDestinationsList"

export const metadata: Metadata = {
  title: "ExportDestinations",
  description: "List of exportDestinations",
}

export default function Page() {
  return (
    <div>
      <p>
        <Link href={"/export-destinations/new"}>Create ExportDestination</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <ExportDestinationsList />
      </Suspense>
    </div>
  )
}
