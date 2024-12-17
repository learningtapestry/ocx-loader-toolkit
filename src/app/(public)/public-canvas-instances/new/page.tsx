import { Metadata } from "next"
import { Suspense } from "react"

import { New__ModelName } from "../components/NewCanvasInstance"
import ApiKeyInstructions from "../components/ApiKeyInstructions"

export const metadata: Metadata = {
  title: "Link Canvas Instance",
  description: "Link a Canvas instance",
}

export default function Page() {
  return (
    <div className='content'>
      <h2>Connect your Canvas instance</h2>

      <ApiKeyInstructions />

      <Suspense fallback={<div>Loading...</div>}>
        <New__ModelName />
      </Suspense>
    </div>
  )
}
