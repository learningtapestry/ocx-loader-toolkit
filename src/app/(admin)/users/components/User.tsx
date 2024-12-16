"use client";
import { useMutation, useQuery } from "@blitzjs/rpc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import deleteUser from "../mutations/deleteUser";
import getUser from "../queries/getUser";

export const User = ({ userId }: { userId: number }) => {
  const router = useRouter();
  const [deleteUserMutation] = useMutation(deleteUser);
  const [user] = useQuery(getUser, { id: userId });

  return (
    <>
      <div>
        <h1>Project {user.id}</h1>
        <pre>{JSON.stringify(user, null, 2)}</pre>

        <Link href={`/users/${user.id}/edit`}>Edit</Link>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteUserMutation({ id: user.id });
              router.push("/users");
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
