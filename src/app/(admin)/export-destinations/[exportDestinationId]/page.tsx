import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getExportDestination from "../queries/getExportDestination"
import { ExportDestination } from "../components/ExportDestination"

export async function generateMetadata({ params }: ExportDestinationPageProps): Promise<Metadata> {
  const ExportDestination = await invoke(getExportDestination, {
    id: Number(params.exportDestinationId),
  })
  return {
    title: `ExportDestination ${ExportDestination.id} - ${ExportDestination.name}`,
  }
}

type ExportDestinationPageProps = {
  params: { exportDestinationId: string }
}

export default async function Page({ params }: ExportDestinationPageProps) {
  return (
    <div>
      <p>
        <Link href={"/export-destinations"}>ExportDestinations</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <ExportDestination exportDestinationId={Number(params.exportDestinationId)} />
      </Suspense>
    </div>
  )
}
