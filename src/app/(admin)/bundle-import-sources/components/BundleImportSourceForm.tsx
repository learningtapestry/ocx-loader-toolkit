import React, { Suspense } from "react"
import { Form, FormProps } from "@/src/app/components/Form"
import { LabeledTextField } from "@/src/app/components/LabeledTextField"

import { z } from "zod"
export { FORM_ERROR } from "@/src/app/components/Form"

export function BundleImportSourceForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  return (
    <Form<S> {...props}>
      <LabeledTextField name="name" label="Name" placeholder="Name" />
      <LabeledTextField name="type" label="Type" placeholder="Type" />
      <LabeledTextField name="baseUrl" label="Base URL" placeholder="Base URL" />
      <LabeledTextField name="accessData.api_secret_key" label="API Secret Key" placeholder="API Secret Key" />
    </Form>
  )
}
