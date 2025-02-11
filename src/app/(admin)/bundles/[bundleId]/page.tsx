import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { invoke } from "src/app/blitz-server";
import getBundle from "../queries/getBundle";
import { Bundle } from "../components/Bundle";
import { EditBundle } from "../components/EditBundle";

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

  const bundle = await invoke(getBundle, { id: Number(params.bundleId) });

  if (bundle.importStatus == "completed") {
    return (
      <div>
        <p>
          <Link href={"/bundles"}>Bundles</Link>
        </p>
        <Suspense fallback={<div>Loading...</div>}>
          <Bundle bundleId={Number(params.bundleId)} />
        </Suspense>
      </div>
    );
  } else {
    return (
      <div>
        <Suspense fallback={<div>Loading...</div>}>
          <EditBundle bundleId={Number(params.bundleId)} />
        </Suspense>
      </div>
    )
  }
}
