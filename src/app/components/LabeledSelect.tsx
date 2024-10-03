import { forwardRef, PropsWithoutRef } from "react"
import { useFormContext, Controller } from "react-hook-form"

export interface LabeledSelectProps extends PropsWithoutRef<JSX.IntrinsicElements["select"]> {
  name: string
  label: string
  outerProps?: PropsWithoutRef<JSX.IntrinsicElements["div"]>
  labelProps?: PropsWithoutRef<JSX.IntrinsicElements["label"]>
  options: { value: string; label: string }[]
}

export const LabeledSelect = forwardRef<HTMLSelectElement, LabeledSelectProps>(
  ({ name, label, outerProps, labelProps, options, ...props }, ref) => {
    const {
      control,
      formState: { isSubmitting, errors },
    } = useFormContext()

    const error = Array.isArray(errors[name])
      ? errors[name].join(", ")
      : errors[name]?.message || errors[name]

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
        {error && (
          <div role="alert" style={{ color: "red" }}>
            {error}
          </div>
        )}
      </div>
    )
  }
)

export default LabeledSelect
