"use client";
import { setQueryData, useMutation, useQuery } from "@blitzjs/rpc"
import Link from "next/link";
import { useRouter } from "next/navigation";
import deleteBundle from "../mutations/deleteBundle";
import loadBundle from "../mutations/loadBundle";
import getBundle from "../queries/getBundle";

export const Bundle = ({ bundleId }: { bundleId: number }) => {
  const router = useRouter();
  const [deleteBundleMutation] = useMutation(deleteBundle);
  const [loadBundleMutation] = useMutation(loadBundle);
  const [bundle] = useQuery(getBundle, { id: bundleId });

  return (
    <>
      <div>
        <h1>Bundle {bundle.name}</h1>
        <pre>{JSON.stringify(bundle, null, 2)}</pre>

        <Link href={`/bundles/${bundle.id}/edit`}>Edit</Link>

        <button
          type="button"
          onClick={async () => {
            const updatedBundle = await loadBundleMutation({ id: bundle.id })
            await setQueryData(getBundle, { id: bundle.id }, updatedBundle)
          }}
          style={{ marginLeft: "0.5rem" }}
        >
          Load Data
        </button>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteBundleMutation({ id: bundle.id });
              router.push("/bundles");
            }
          }}
          style={{ marginLeft: "0.5rem" }}
        >
          Delete
        </button>
      </div>
    </>
  );
};
