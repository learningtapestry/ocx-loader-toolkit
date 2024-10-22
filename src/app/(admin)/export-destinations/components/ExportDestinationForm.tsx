import React from "react"
import { Form, FormProps } from "src/app/components/Form"
import { LabeledTextField } from "src/app/components/LabeledTextField"
import { z } from "zod"
import { JsonEditor } from 'json-edit-react'

export function ExportDestinationForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  const [metadata, setMetadata] = React.useState((props.initialValues as any)?.metadata || {})

  const handleSubmit = async (values: z.infer<S>) => {
    await props.onSubmit({ ...values, metadata })
  }

  return (
    <Form<S> {...props} onSubmit={handleSubmit}>
      <LabeledTextField name="name" label="Name" placeholder="Name" />
      <LabeledTextField name="type" label="Type" placeholder="Type" />
      <LabeledTextField name="baseUrl" label="Base URL" placeholder="Base URL" />
      <div>
        <label>Metadata</label>
        <JsonEditor data={metadata} setData={setMetadata} />
      </div>
    </Form>
  )
}
