import { Metadata } from "next"
import { Suspense } from "react"
import { New__ModelName } from "../components/NewCanvasInstance"

export const metadata: Metadata = {
  title: "New Canvas Instance",
  description: "Create a new canvas instance",
}

export default function Page() {
  return (
    <div>
      <h1>Create New Canvas Instance</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <New__ModelName />
      </Suspense>
    </div>
  )
}
