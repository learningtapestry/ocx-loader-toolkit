import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { invoke } from "src/app/blitz-server";
import getBundle from "../queries/getPublicBundle";
import { PublicBundle } from "../components/PublicBundle";

export async function generateMetadata({
  params,
}: BundlePageProps): Promise<Metadata> {
  const Bundle = await invoke(getBundle, { id: Number(params.bundleId) });
  return {
    title: `Bundle ${Bundle.id} - ${Bundle.name}`,
  };
}

type BundlePageProps = {
  params: { bundleId: string };
};

export default async function Page({ params }: BundlePageProps) {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <PublicBundle bundleId={Number(params.bundleId)} />
      </Suspense>
    </div>
  );
}
