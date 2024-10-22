import React from "react"
import { Form, FormProps } from "src/app/components/Form"
import { LabeledSelect } from "src/app/components/LabeledSelect"
import { z } from "zod"
import { useQuery } from "@blitzjs/rpc"
import getCanvasInstances from "../../canvas-instances/queries/getCanvasInstances"
import LabeledTextField from "src/app/components/LabeledTextField"

export function CanvasOAuth2Form<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  const [canvasInstances] = useQuery(getCanvasInstances, {})

  const handleSubmit = async (values: z.infer<S>) => {
    console.log('values', values)

    // Process the form values here
    const processedValues = {
      ...values,
      canvasInstanceId: parseInt(values.canvasInstanceId as string, 10),
    }

    // Call the onSubmit prop with the processed values
    return props.onSubmit(processedValues)
  }

  return (
    <Form<S> {...props} onSubmit={handleSubmit}>
      <LabeledTextField name="name" label="Name" placeholder="Enter a name for this connection" />
      <LabeledSelect
        name="canvasInstanceId"
        label="Canvas Instance"
        options={canvasInstances.canvasInstances.map((instance) => ({
          value: instance.id.toString(),
          label: instance.name,
        }))}
      />
    </Form>
  )
}
