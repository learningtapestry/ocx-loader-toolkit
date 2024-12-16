import React, { Suspense } from "react";
import { Form, FormProps } from "src/app/components/Form";
import { LabeledTextField } from "src/app/components/LabeledTextField";

import { z } from "zod";
export { FORM_ERROR } from "src/app/components/Form";

export function UserForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  return (
    <Form<S> {...props}>
      <LabeledTextField name="email" label="Email" placeholder="Email" />
      <LabeledTextField name="name" label="Name" placeholder="Name" />
      <LabeledTextField name="role" label="Role" placeholder="Role" />
      <LabeledTextField name="password" type="password" label="Password" placeholder="Password" />
    </Form>
  );
}
