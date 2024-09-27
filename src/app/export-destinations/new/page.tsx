import { Metadata } from "next"
import { Suspense } from "react"
import { New__ModelName } from "../components/NewExportDestination"

export const metadata: Metadata = {
  title: "New Export Destination",
  description: "Create a new export destination",
}

export default function Page() {
  return (
    <div>
      <h1>Create New Export Destination</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <New__ModelName />
      </Suspense>
    </div>
  )
}
