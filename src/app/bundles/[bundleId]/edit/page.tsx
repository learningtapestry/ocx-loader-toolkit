import { Metadata } from "next";
import { Suspense } from "react";
import { invoke } from "src/app/blitz-server";
import getBundle from "../../queries/getBundle";
import { EditBundle } from "../../components/EditBundle";

type EditBundlePageProps = {
  params: { bundleId: string };
};

export async function generateMetadata({
  params,
}: EditBundlePageProps): Promise<Metadata> {
  const Bundle = await invoke(getBundle, { id: Number(params.bundleId) });
  return {
    title: `Edit Bundle ${Bundle.id} - ${Bundle.name}`,
  };
}

export default async function Page({ params }: EditBundlePageProps) {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditBundle bundleId={Number(params.bundleId)} />
      </Suspense>
    </div>
  );
}
