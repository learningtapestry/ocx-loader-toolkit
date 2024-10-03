import { Metadata } from "next"
import { Suspense } from "react"
import { NewCanvasOAuth2ExportDestination } from "../components/NewCanvasOAuth2ExportDestination"

export const metadata: Metadata = {
  title: "New Canvas OAuth2 Export Destination",
  description: "Create a new Canvas OAuth2 export destination",
}

export default function Page() {
  return (
    <div>
      <h1>New Canvas OAuth2 Export Destination</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <NewCanvasOAuth2ExportDestination />
      </Suspense>
    </div>
  )
}
