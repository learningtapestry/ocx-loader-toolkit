import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NodesList } from "./components/NodesList";

export const metadata: Metadata = {
  title: "Nodes",
  description: "List of nodes",
};

export default function Page() {
  return (
    <div>
      <p>
        <Link href={"/nodes/new"}>Create Node</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <NodesList />
      </Suspense>
    </div>
  );
}
