import React, { Suspense } from "react"
import { Form, FormProps } from "@/src/app/components/Form"
import { LabeledTextField } from "@/src/app/components/LabeledTextField"
import { ImportSourceTypeSelector } from "./ImportSourceTypeSelector"
import { useFormContext } from "react-hook-form"

import { z } from "zod"
export { FORM_ERROR } from "@/src/app/components/Form"

function BundleImportSourceFormContent() {
  const { watch, setValue } = useFormContext()
  const selectedType = watch("type") || ""

  // Set default interval when satchel type is selected
  React.useEffect(() => {
    if (selectedType === "satchel") {
      setValue("accessData.interval_minutes", "60")
    }
  }, [selectedType, setValue])

  return (
    <>
      <LabeledTextField name="name" label="Name" placeholder="Name" />
      
      <ImportSourceTypeSelector
        value={selectedType} 
        onChange={(value) => {
          setValue("type", value)
        }} 
      />
      
      <LabeledTextField name="baseUrl" label="Base URL" placeholder="Base URL" />
      
      {selectedType === "lcms-legacy-ose" && (
        <LabeledTextField name="accessData.api_secret_key" label="API Secret Key" placeholder="API Secret Key" />
      )}
      
      {selectedType === "satchel" && (
        <LabeledTextField name="accessData.interval_minutes" label="Interval (minutes)" />
      )}
      
      {!selectedType && (
        <div className="text-sm text-gray-500 italic">
          Please select an import source type to see configuration options.
        </div>
      )}
    </>
  )
}

export function BundleImportSourceForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  return (
    <Form<S> {...props}>
      <BundleImportSourceFormContent />
    </Form>
  )
}
