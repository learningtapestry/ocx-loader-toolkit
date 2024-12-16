import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { UsersList } from "./components/UsersList";

export const metadata: Metadata = {
  title: "Users",
  description: "List of users",
};

export default function Page() {
  return (
    <div>
      <p>
        <Link href={"/users/new"}>Create User</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <UsersList />
      </Suspense>
    </div>
  );
}
