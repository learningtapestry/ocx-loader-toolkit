import { Metadata } from "next";
import { Suspense } from "react";
import { New__ModelName } from "../components/NewBundle";

export const metadata: Metadata = {
  title: "New Bundle",
  description: "Create a new bundle",
};

export default function Page() {
  return (
    <div>
      <h1>Create New Bundle</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <New__ModelName />
      </Suspense>
    </div>
  );
}
