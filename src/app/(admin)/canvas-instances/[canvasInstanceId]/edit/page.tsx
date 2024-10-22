import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getCanvasInstance from "../../queries/getCanvasInstance"
import { EditCanvasInstance } from "../../components/EditCanvasInstance"

type EditCanvasInstancePageProps = {
  params: { canvasInstanceId: string }
}

export async function generateMetadata({ params }: EditCanvasInstancePageProps): Promise<Metadata> {
  const CanvasInstance = await invoke(getCanvasInstance, { id: Number(params.canvasInstanceId) })
  return {
    title: `Edit CanvasInstance ${CanvasInstance.id} - ${CanvasInstance.name}`,
  }
}

export default async function Page({ params }: EditCanvasInstancePageProps) {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditCanvasInstance canvasInstanceId={Number(params.canvasInstanceId)} />
      </Suspense>
    </div>
  )
}
