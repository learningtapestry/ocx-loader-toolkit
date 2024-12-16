import { z } from "zod";

export const email = z
  .string()
  .email()
  .transform((str) => str.toLowerCase().trim())

export const password = z
  .string()
  .min(10)
  .max(100)
  .transform((str) => str.trim())

export const Signup = z.object({
  email,
  password,
})

export const CreateUserSchema = z.object({
  name: z.string(),
  email,
  password,
  role: z.string(),
});
export const UpdateUserSchema = CreateUserSchema.merge(
  z.object({
    id: z.number(),
  })
);

export const DeleteUserSchema = z.object({
  id: z.number(),
});
