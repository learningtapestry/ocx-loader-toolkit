"use client";
import { FORM_ERROR, BundleForm } from "./BundleForm";
import { CreateBundleSchema } from "../schemas";
import { useMutation } from "@blitzjs/rpc";
import createBundle from "../mutations/createBundle";
import { useRouter } from "next/navigation";

export function New__ModelName() {
  const [createBundleMutation] = useMutation(createBundle);
  const router = useRouter();
  return (
    <BundleForm
      submitText="Create Bundle"
      schema={CreateBundleSchema}
      onSubmit={async (values) => {
        try {
          const bundle = await createBundleMutation(values);
          router.push(`/bundles/${bundle.id}`);
        } catch (error: any) {
          console.error(error);
          return {
            [FORM_ERROR]: error.toString(),
          };
        }
      }}
    />
  );
}
