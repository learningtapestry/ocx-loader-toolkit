import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BundlesList } from "./components/BundlesList";

export const metadata: Metadata = {
  title: "Bundles",
  description: "List of bundles",
};

export default function Page() {
  return (
    <div>
      <p>
        <Link href={"/bundles/new"}>Create Bundle</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <BundlesList />
      </Suspense>
    </div>
  );
}
