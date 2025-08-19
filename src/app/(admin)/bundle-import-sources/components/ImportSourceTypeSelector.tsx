import React from "react"
import { useFormContext } from "react-hook-form"
import { ErrorMessage } from "@hookform/error-message"

interface ImportSourceTypeSelectorProps {
  value: string
  onChange: (value: string) => void
}

const importSourceTypes = [
  {
    value: "",
    label: "Select an import source type...",
    description: ""
  },
  {
    value: "lcms-legacy-ose",
    label: "LCMS Legacy OpenSciEd",
    description: "Import from LCMS legacy OpenSciEd system"
  },
  {
    value: "satchel",
    label: "Satchel",
    description: "Periodically fetch JSON data from a URL"
  }
]

export function ImportSourceTypeSelector({ value, onChange }: ImportSourceTypeSelectorProps) {
  const { register, formState: { errors } } = useFormContext()

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Import Source Type
      </label>
      <select
        {...register("type")}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        {importSourceTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
      {value && (
        <p className="mt-1 text-sm text-gray-500">
          {importSourceTypes.find(t => t.value === value)?.description}
        </p>
      )}
      <ErrorMessage
        render={({ message }) => (
          <div role="alert" style={{ color: "red" }}>
            {message}
          </div>
        )}
        errors={errors}
        name="type"
      />
    </div>
  )
} 