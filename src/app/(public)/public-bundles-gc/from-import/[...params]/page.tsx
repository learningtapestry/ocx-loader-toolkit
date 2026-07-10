import { Suspense } from "react"

import getBundleIdFromImport from "../../../public-bundles/queries/getPublicBundleIdFromImport"
import { PublicBundleGoogleClassroom } from "../../components/PublicBundleGoogleClassroom"
import { invoke } from "src/app/blitz-server"

type BundlePageProps = {
  params: { params: string[] }
}

export default async function Page({ params }: BundlePageProps) {
  const { params: pathSegments } = params

  const [bundleImportSourceIdString, ...coordinates] = pathSegments

  const bundleImportSourceId = parseInt(bundleImportSourceIdString)

  const bundleId = await invoke(
    getBundleIdFromImport,
    {
      bundleImportSourceId: Number(bundleImportSourceId),
      coordinates
    },
  )

  const language = coordinates.pop() as string

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <div className='intro'>
          The Google Classroom Loader tool below will add the identified unit to your Google Classroom account.
          You will be asked to sign in with Google and authorize access to create a course on your behalf.
        </div>

        <div className='content'>
          <PublicBundleGoogleClassroom bundleId={bundleId} language={language} />
        </div>
      </Suspense>
    </div>
  )
}
