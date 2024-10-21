import React from "react"
import { Form, FormProps } from "src/app/components/Form"
import { LabeledTextField } from "src/app/components/LabeledTextField"
import { useFormContext } from "react-hook-form"
import { z } from "zod"
export { FORM_ERROR } from "src/app/components/Form"

export function CanvasInstanceForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  return (
    <Form<S> {...props}>
      <LabeledTextField
        name="baseUrl"
        label="Base URL"
        placeholder="https://canvas.instructure.com"
      />
      <LabeledTextField name="clientId" label="Client ID" placeholder="Client ID" />
      <LabeledTextField
        name="clientSecret"
        label="Client Secret"
        placeholder="Client Secret"
        type="password"
      />

      <RegisterLocalBaseUrl />
    </Form>
  )
}

function RegisterLocalBaseUrl() {
  const { register, setValue } = useFormContext()

  React.useEffect(() => {
    const origin = window.location.origin
    register("localBaseUrl")
    setValue("localBaseUrl", origin)
  }, [register, setValue])

  return null
}