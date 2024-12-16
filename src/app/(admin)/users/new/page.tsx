import { Metadata } from "next";
import { Suspense } from "react";
import { New__ModelName } from "../components/NewUser";

export const metadata: Metadata = {
  title: "New User",
  description: "Create a new user",
};

export default function Page() {
  return (
    <div>
      <h1>Create New User</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <New__ModelName />
      </Suspense>
    </div>
  );
}
