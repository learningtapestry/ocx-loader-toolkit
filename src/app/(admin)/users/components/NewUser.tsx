"use client";
import { FORM_ERROR, UserForm } from "./UserForm";
import { CreateUserSchema } from "../schemas";
import { useMutation } from "@blitzjs/rpc";
import createUser from "../mutations/createUser";
import { useRouter } from "next/navigation";

export function New__ModelName() {
  const [createUserMutation] = useMutation(createUser);
  const router = useRouter();
  return (
    <UserForm
      submitText="Create User"
      schema={CreateUserSchema}
      onSubmit={async (values) => {
        try {
          const user = await createUserMutation(values);
          router.push(`/users/${user.id}`);
        } catch (error: any) {
          console.error(error);
          return {
            [FORM_ERROR]: error.toString(),
          };
        }
      }}
    />
  );
}
