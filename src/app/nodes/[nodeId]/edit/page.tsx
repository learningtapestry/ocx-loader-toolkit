import { Metadata } from "next";
import { Suspense } from "react";
import { invoke } from "src/app/blitz-server";
import getNode from "../../queries/getNode";
import { EditNode } from "../../components/EditNode";

type EditNodePageProps = {
  params: { nodeId: string };
};

export async function generateMetadata({
  params,
}: EditNodePageProps): Promise<Metadata> {
  const Node = await invoke(getNode, { id: Number(params.nodeId) });
  return {
    title: `Edit Node ${Node.id} - ${Node.name}`,
  };
}

export default async function Page({ params }: EditNodePageProps) {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditNode nodeId={Number(params.nodeId)} />
      </Suspense>
    </div>
  );
}
