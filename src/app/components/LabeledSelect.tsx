import { forwardRef, PropsWithoutRef } from "react"
import { useFormContext, Controller } from "react-hook-form"

export interface LabeledSelectProps extends PropsWithoutRef<JSX.IntrinsicElements["select"]> {
  name: string
  label: string
  outerProps?: PropsWithoutRef<JSX.IntrinsicElements["div"]>
  labelProps?: PropsWithoutRef<JSX.IntrinsicElements["label"]>
  options: { value: string; label: string }[]
}

function getErrorMessage(error: any): string | undefined {
  if (!error) return undefined
  if (typeof error === 'string') return error
  if (Array.isArray(error)) return error.map(getErrorMessage).join(', ')
  if (error.message) return error.message
  if (typeof error === 'object') {
    return Object.values(error).map(getErrorMessage).filter(Boolean).join(', ')
  }
  return undefined
}

export const LabeledSelect = forwardRef<HTMLSelectElement, LabeledSelectProps>(
  ({ name, label, outerProps, labelProps, options, ...props }, ref) => {
    const {
      control,
      formState: { isSubmitting, errors },
    } = useFormContext()

    const errorMessage = getErrorMessage(errors[name])

    return (
      <div {...outerProps}>
        <label {...labelProps}>
          {label}
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <select
                {...field}
                disabled={isSubmitting}
                {...props}
                ref={ref}
                onChange={(e) => {
                  field.onChange(e)
                  if (props.onChange) {
                    props.onChange(e)
                  }
                }}
              >
                <option value="">Choose one</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          />
        </label>
        {errorMessage && (
          <div role="alert" style={{ color: "red" }}>
            {errorMessage}
          </div>
        )}
      </div>
    )
  }
)

export default LabeledSelect
