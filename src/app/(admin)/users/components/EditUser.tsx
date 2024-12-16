"use client";
import { Suspense } from "react";
import updateUser from "../mutations/updateUser";
import getUser from "../queries/getUser";
import { UpdateUserSchema } from "../schemas";
import { FORM_ERROR, UserForm } from "./UserForm";
import { useMutation, useQuery } from "@blitzjs/rpc";
import { useRouter } from "next/navigation";

export const EditUser = ({ userId }: { userId: number }) => {
  const [user, { setQueryData }] = useQuery(
    getUser,
    { id: userId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  );
  const [updateUserMutation] = useMutation(updateUser);
  const router = useRouter();
  return (
    <>
      <div>
        <h1>Edit User {user.id}</h1>
        <pre>{JSON.stringify(user, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <UserForm
            submitText="Update User"
            schema={UpdateUserSchema}
            initialValues={user}
            onSubmit={async (values) => {
              try {
                const updated = await updateUserMutation({
                  ...values,
                  id: user.id,
                });
                await setQueryData(updated);
                router.refresh();
              } catch (error: any) {
                console.error(error);
                return {
                  [FORM_ERROR]: error.toString(),
                };
              }
            }}
          />
        </Suspense>
      </div>
    </>
  );
};
