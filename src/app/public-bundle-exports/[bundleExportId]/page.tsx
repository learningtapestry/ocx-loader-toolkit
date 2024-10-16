import { Metadata } from "next";
import { Suspense } from "react";
import { invoke } from "src/app/blitz-server";

import getBundleExport from "../queries/getPublicBundleExport";

import { PublicBundleExport } from "../components/PublicBundleExport";

export async function generateMetadata({
  params,
}: BundleExportPageProps): Promise<Metadata> {
  const bundleExport = await invoke(getBundleExport, { id: Number(params.bundleExportId) });
  return {
    title: `Bundle Export ${bundleExport.id} - ${bundleExport.name}`,
  };
}

type BundleExportPageProps = {
  params: { bundleExportId: string };
};

export default async function Page({ params }: BundleExportPageProps) {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <PublicBundleExport bundleExportId={Number(params.bundleExportId)} />
      </Suspense>
    </div>
  );
}
