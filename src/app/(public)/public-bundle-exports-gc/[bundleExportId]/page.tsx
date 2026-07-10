import { Metadata } from "next";
import { Suspense } from "react";
import { invoke } from "src/app/blitz-server";

import getBundleExport from "../../public-bundle-exports/queries/getPublicBundleExport";

import { PublicBundleExportGcContainer } from "../components/PublicBundleExportGcContainer"

export async function generateMetadata({
  params,
}: BundleExportPageProps): Promise<Metadata> {
  const bundleExport = await invoke(getBundleExport, { id: Number(params.bundleExportId) });
  return {
    title: `Google Classroom Export ${bundleExport.id} - ${bundleExport.name}`,
  };
}

type BundleExportPageProps = {
  params: {
    bundleExportId: string
  },
  searchParams: {
    token: string,
  },
};

export default async function Page({ params, searchParams }: BundleExportPageProps) {
  const { bundleExportId } = params;
  const { token } = searchParams;

  return (
    <div className='content'>
      <Suspense fallback={<div>Loading...</div>}>
        <PublicBundleExportGcContainer bundleExportId={Number(bundleExportId)} token={token} />
      </Suspense>
    </div>
  );
}
