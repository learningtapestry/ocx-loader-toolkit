"use client";
import { FORM_ERROR, NodeForm } from "./NodeForm";
import { CreateNodeSchema } from "../schemas";
import { useMutation } from "@blitzjs/rpc";
import createNode from "../mutations/createNode";
import { useRouter } from "next/navigation";

export function New__ModelName() {
  const [createNodeMutation] = useMutation(createNode);
  const router = useRouter();
  return (
    <NodeForm
      submitText="Create Node"
      schema={CreateNodeSchema}
      onSubmit={async (values) => {
        try {
          const node = await createNodeMutation(values);
          router.push(`/nodes/${node.id}`);
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
