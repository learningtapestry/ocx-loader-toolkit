import { Metadata } from "next";
import { Suspense } from "react"

import getBundleIdFromImport from "../../queries/getPublicBundleIdFromImport"
import { PublicBundle } from "../../components/PublicBundle"
import { invoke } from "src/app/blitz-server"

import { ClientInfoVar } from "src/app/components/ClientInfoVar"
import Link from "next/link";
import getClientInfoVars, { ClientInfoVarsResponse } from "src/app/queries/getClientInfoVars"

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

  // Use invoke to call the resolver
  const clientInfoVars: ClientInfoVarsResponse = await invoke(getClientInfoVars, {})

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        {/* <Intro/> */}
        <div className='intro'>
          The {clientInfoVars.clientName || ""} Canvas Loader tool below will add the identified unit to your Canvas instance.
          For the tool to work, your Canvas administrator will need to have approved use of the tool.
          Visit the <Link href={clientInfoVars.canvasLoaderAdministratorUrl || "" as any}>Canvas Administrator page</Link> for more information on the approval process.
        </div>
      
        <div className='content'>
          <PublicBundle bundleId={bundleId} language={language} />
        </div>
      </Suspense>
    </div>
  )
}
