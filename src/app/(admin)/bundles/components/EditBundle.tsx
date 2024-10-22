"use client";
import { Suspense } from "react";
import updateBundle from "../mutations/updateBundle";
import getBundle from "../queries/getBundle";
import { UpdateBundleSchema } from "../schemas";
import { FORM_ERROR, BundleForm } from "./BundleForm";
import { useMutation, useQuery } from "@blitzjs/rpc";
import { useRouter } from "next/navigation";

export const EditBundle = ({ bundleId }: { bundleId: number }) => {
  const [bundle, { setQueryData }] = useQuery(
    getBundle,
    { id: bundleId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  );
  const [updateBundleMutation] = useMutation(updateBundle);
  const router = useRouter();
  return (
    <>
      <div>
        <h1>Edit Bundle {bundle.name}</h1>
        <pre>{JSON.stringify(bundle, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <BundleForm
            submitText="Update Bundle"
            schema={UpdateBundleSchema}
            initialValues={bundle}
            onSubmit={async (values) => {
              try {
                const updated = await updateBundleMutation({
                  ...values,
                  id: bundle.id,
                });
                // @ts-ignore
                await setQueryData(updated);
                router.refresh();
              } catch (error: any) {
                console.error(error);
                return {
                  [FORM_ERROR]: error.toString(),
                };
              }
            }}
          />
        </Suspense>
      </div>
    </>
  );
};
