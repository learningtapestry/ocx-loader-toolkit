import { Metadata } from "next";
import { Suspense } from "react";
import { invoke } from "src/app/blitz-server";
import getUser from "../../queries/getUser";
import { EditUser } from "../../components/EditUser";

type EditUserPageProps = {
  params: { userId: string };
};

export async function generateMetadata({
  params,
}: EditUserPageProps): Promise<Metadata> {
  const User = await invoke(getUser, { id: Number(params.userId) });
  return {
    title: `Edit User ${User.id} - ${User.name}`,
  };
}

export default async function Page({ params }: EditUserPageProps) {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditUser userId={Number(params.userId)} />
      </Suspense>
    </div>
  );
}
