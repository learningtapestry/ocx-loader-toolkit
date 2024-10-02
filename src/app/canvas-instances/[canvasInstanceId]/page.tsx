import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getCanvasInstance from "../queries/getCanvasInstance"
import { CanvasInstance } from "../components/CanvasInstance"

export async function generateMetadata({ params }: CanvasInstancePageProps): Promise<Metadata> {
  const CanvasInstance = await invoke(getCanvasInstance, { id: Number(params.canvasInstanceId) })
  return {
    title: `CanvasInstance ${CanvasInstance.id} - ${CanvasInstance.name}`,
  }
}

type CanvasInstancePageProps = {
  params: { canvasInstanceId: string }
}

export default async function Page({ params }: CanvasInstancePageProps) {
  return (
    <div>
      <p>
        <Link href={"/canvas-instances"}>Canvas Instances</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <CanvasInstance canvasInstanceId={Number(params.canvasInstanceId)} />
      </Suspense>
    </div>
  )
}
