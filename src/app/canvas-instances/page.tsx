import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { CanvasInstancesList } from "./components/CanvasInstancesList"

export const metadata: Metadata = {
  title: "CanvasInstances",
  description: "List of canvasInstances",
}

export default function Page() {
  return (
    <div>
      <p>
        <Link href={"/canvas-instances/new"}>Create CanvasInstance</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <CanvasInstancesList />
      </Suspense>
    </div>
  )
}
