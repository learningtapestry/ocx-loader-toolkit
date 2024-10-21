import { Metadata } from "next";
import { Suspense } from "react";
import { invoke } from "src/app/blitz-server";

import getBundleExport from "../queries/getPublicBundleExport";

import { PublicBundleExportContainer } from "@/src/app/public-bundle-exports/components/PublicBundleExportContainer"

export async function generateMetadata({
  params,
}: BundleExportPageProps): Promise<Metadata> {
  const bundleExport = await invoke(getBundleExport, { id: Number(params.bundleExportId) });
  return {
    title: `Bundle Export ${bundleExport.id} - ${bundleExport.name}`,
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
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <PublicBundleExportContainer bundleExportId={Number(bundleExportId)} token={token} />
      </Suspense>
    </div>
  );
}
