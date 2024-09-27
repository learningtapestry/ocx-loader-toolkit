import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getExportDestination from "../../queries/getExportDestination"
import { EditExportDestination } from "../../components/EditExportDestination"

type EditExportDestinationPageProps = {
  params: { exportDestinationId: string }
}

export async function generateMetadata({
  params,
}: EditExportDestinationPageProps): Promise<Metadata> {
  const ExportDestination = await invoke(getExportDestination, {
    id: Number(params.exportDestinationId),
  })
  return {
    title: `Edit ExportDestination ${ExportDestination.id} - ${ExportDestination.name}`,
  }
}

export default async function Page({ params }: EditExportDestinationPageProps) {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditExportDestination exportDestinationId={Number(params.exportDestinationId)} />
      </Suspense>
    </div>
  )
}
