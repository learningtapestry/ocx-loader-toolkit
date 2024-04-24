"use client";
import { setQueryData, useMutation, useQuery } from "@blitzjs/rpc"
import Link from "next/link";
import { useRouter } from "next/navigation";
import deleteBundle from "../mutations/deleteBundle";
import importBundle from "../mutations/importBundle";
import getBundle from "../queries/getBundle";

import OcxBundle from "@/src/lib/OcxBundle";

import Node from "./Node";

export const Bundle = ({ bundleId }: { bundleId: number }) => {
  const router = useRouter();
  const [deleteBundleMutation] = useMutation(deleteBundle);
  const [importBundleMutation] = useMutation(importBundle);
  const [bundle] = useQuery(getBundle, { id: bundleId });

  const ocxBundle = new OcxBundle(bundle, bundle.nodes);

  return (
    <>
      <div>
        <h1>Bundle {bundle.name}</h1>

        {
          ocxBundle.rootNodes.map((node) => <Node key={node.ocxId} node={node} />)
        }

        {
          bundle.parsedSitemap && (
            <div>
              <h2>Parsed Sitemap</h2>
              <pre>{JSON.stringify(bundle.parsedSitemap, null, 2)}</pre>
            </div>
          )
        }

        <Link href={`/bundles/${bundle.id}/edit`}>Edit</Link>

        <button
          type="button"
          onClick={async () => {
            const updatedBundle = await importBundleMutation({ id: bundle.id })
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
