"use client";
import { useMutation, useQuery } from "@blitzjs/rpc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import deleteNode from "../mutations/deleteNode";
import getNode from "../queries/getNode";

export const Node = ({ nodeId }: { nodeId: number }) => {
  const router = useRouter();
  const [deleteNodeMutation] = useMutation(deleteNode);
  const [node] = useQuery(getNode, { id: nodeId });

  return (
    <>
      <div>
        <h1>Project {node.id}</h1>
        <pre>{JSON.stringify(node, null, 2)}</pre>

        <Link href={`/nodes/${node.id}/edit`}>Edit</Link>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteNodeMutation({ id: node.id });
              router.push("/nodes");
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
