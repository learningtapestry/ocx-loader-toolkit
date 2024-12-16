import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { invoke } from "src/app/blitz-server";
import getUser from "../queries/getUser";
import { User } from "../components/User";

export async function generateMetadata({
  params,
}: UserPageProps): Promise<Metadata> {
  const User = await invoke(getUser, { id: Number(params.userId) });
  return {
    title: `User ${User.id} - ${User.name}`,
  };
}

type UserPageProps = {
  params: { userId: string };
};

export default async function Page({ params }: UserPageProps) {
  return (
    <div>
      <p>
        <Link href={"/users"}>Users</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <User userId={Number(params.userId)} />
      </Suspense>
    </div>
  );
}
