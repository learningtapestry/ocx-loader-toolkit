import React from "react"
import { Form, FormProps } from "src/app/components/Form"
import { LabeledTextArea, LabeledTextField } from "src/app/components/LabeledTextField"
import { z } from "zod"

export function ExportDestinationForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  return (
    <Form<S> {...props}>
      <LabeledTextField name="name" label="Name" placeholder="Name" />
      <LabeledTextField name="type" label="Type" placeholder="Type" />
      <LabeledTextField name="baseUrl" label="Base URL" placeholder="Base URL" />
      <LabeledTextArea name="metadata" label="Metadata" placeholder="Metadata (JSON)" />
    </Form>
  )
}
