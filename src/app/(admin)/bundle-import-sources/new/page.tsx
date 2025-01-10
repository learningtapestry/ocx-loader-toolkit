import { Metadata } from "next"
import { Suspense } from "react"
import { New__ModelName } from "../components/NewBundleImportSource"

export const metadata: Metadata = {
  title: "New Bundle Import Source",
  description: "Create a new Bundle Import Source",
}

export default function Page() {
  return (
    <div>
      <h1>Create New Bundle Import Source</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <New__ModelName />
      </Suspense>
    </div>
  )
}
