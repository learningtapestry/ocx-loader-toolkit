import React from "react"
import { Form, FormProps } from "src/app/components/Form"
import { LabeledTextField } from "src/app/components/LabeledTextField"

import { z } from "zod"
export { FORM_ERROR } from "src/app/components/Form"

export function CanvasInstanceForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  return (
    <Form<S> {...props}>
      <LabeledTextField name="name" label="Name" placeholder="Name" />
      <LabeledTextField name="baseUrl" label="Base URL" placeholder="https://mydistrictname.instructure.com" />
      <LabeledTextField name="clientId" label="Client ID" placeholder="Client ID" />
      <LabeledTextField name="clientSecret" label="Client Secret" placeholder="Client Secret" type="password" />
    </Form>
  )
}
