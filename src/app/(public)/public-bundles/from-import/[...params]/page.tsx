import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react"

import getBundleIdFromImport from "../../queries/getPublicBundleIdFromImport"
import { PublicBundle } from "../../components/PublicBundle"
import { invoke } from "src/app/blitz-server"

// export async function generateMetadata({
//                                          params,
//                                        }: BundlePageProps): Promise<Metadata> {
//   const Bundle = await invoke(getBundle, { id: Number(params.bundleId) });
//   return {
//     title: `Bundle ${Bundle.id} - ${Bundle.name}`,
//   };
// }

type BundlePageProps = {
  params: { params: string[] }
}

export default async function Page({ params }: BundlePageProps) {
  // public-bundles/from-import/1/grade%207/lb/en

  // pathSegments: ['1', 'grade%207', 'lb', 'en']
  // 1 is the importSourceId; the BundleImportSource contains type = lcms-openscied-legacy, which
  // maps to how to interpret the next elements
  // grade%207 maps to grade 7
  // lb is the unit
  // en is the language

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
      <div className='intro'>
        The {process.env.NEXT_PUBLIC_CLIENT_NAME} Canvas Loader tool below will add the identified unit to your Canvas instance.
        For the tool to work, your Canvas administrator will need to have approved use of the tool.
        Visit the Canvas Administrator page for more information on the approval process.
      </div>
      <div className='content'>
        <Suspense fallback={<div>Loading...</div>}>
          <PublicBundle bundleId={bundleId} language={language} />
        </Suspense>
      </div>
    </div>
  )
}
