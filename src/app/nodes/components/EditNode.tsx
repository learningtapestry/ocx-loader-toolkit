"use client";
import { Suspense } from "react";
import updateNode from "../mutations/updateNode";
import getNode from "../queries/getNode";
import { UpdateNodeSchema } from "../schemas";
import { FORM_ERROR, NodeForm } from "./NodeForm";
import { useMutation, useQuery } from "@blitzjs/rpc";
import { useRouter } from "next/navigation";

export const EditNode = ({ nodeId }: { nodeId: number }) => {
  const [node, { setQueryData }] = useQuery(
    getNode,
    { id: nodeId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  );
  const [updateNodeMutation] = useMutation(updateNode);
  const router = useRouter();
  return (
    <>
      <div>
        <h1>Edit Node {node.id}</h1>
        <pre>{JSON.stringify(node, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <NodeForm
            submitText="Update Node"
            schema={UpdateNodeSchema}
            initialValues={node}
            onSubmit={async (values) => {
              try {
                const updated = await updateNodeMutation({
                  ...values,
                  id: node.id,
                });
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
