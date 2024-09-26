import React, { Suspense } from "react";
import { Form, FormProps } from "src/app/components/Form";
import { LabeledTextField } from "src/app/components/LabeledTextField";
import { JsonEditor } from 'json-edit-react'

import { z } from "zod";
export { FORM_ERROR } from "src/app/components/Form";

export function BundleForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  const [sourceAccessData, setSourceAccessData] = React.useState((props.initialValues as any)?.sourceAccessData || {})

  const handleSubmit = async (values: z.infer<S>) => {
    await props.onSubmit({ ...values, sourceAccessData })
  }

  return (
    <Form<S> {...props} onSubmit={handleSubmit}>
      {/* template: <__component__ name="__fieldName__" label="__Field_Name__" placeholder="__Field_Name__"  type="__inputType__" /> */}
      <LabeledTextField
        name="name"
        label="Name"
        placeholder="Name"
        type="text"
      />

      <LabeledTextField
        name="sitemapUrl"
        label="Sitemap Url"
        placeholder="Sitemap Url"
        type="text"
      />

      <LabeledTextField
        name="sourceAccessToken"
        label="Source Access Token"
        placeholder="Source Access Token"
        type="text"
      />

      <div>
        <label>Source Access Data</label>
        <JsonEditor data={sourceAccessData} setData={setSourceAccessData} />
      </div>

    </Form>
  );
}

