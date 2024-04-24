import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { invoke } from "src/app/blitz-server";
import getNode from "../queries/getNode";
import { Node } from "../components/Node";

export async function generateMetadata({
  params,
}: NodePageProps): Promise<Metadata> {
  const Node = await invoke(getNode, { id: Number(params.nodeId) });
  return {
    title: `Node ${Node.id} - ${Node.name}`,
  };
}

type NodePageProps = {
  params: { nodeId: string };
};

export default async function Page({ params }: NodePageProps) {
  return (
    <div>
      <p>
        <Link href={"/nodes"}>Nodes</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <Node nodeId={Number(params.nodeId)} />
      </Suspense>
    </div>
  );
}
