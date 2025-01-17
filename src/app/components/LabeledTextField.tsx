import { forwardRef, PropsWithoutRef, ComponentPropsWithoutRef, useState } from "react"
import { useFormContext } from "react-hook-form"
import { ErrorMessage } from "@hookform/error-message"

export interface LabeledTextFieldProps extends PropsWithoutRef<JSX.IntrinsicElements["input"]> {
  /** Field name. */
  name: string
  /** Field label. */
  label: string
  showpasswordlabel?: string
  hidepasswordlabel?: string
  /** Field type. Doesn't include radio buttons and checkboxes */
  type?: "text" | "password" | "email" | "number"
  outerProps?: PropsWithoutRef<JSX.IntrinsicElements["div"]>
  labelProps?: ComponentPropsWithoutRef<"label">
}

export const LabeledTextField = forwardRef<HTMLInputElement, LabeledTextFieldProps>(
  ({ label, outerProps, labelProps, name, type, ...props }, ref) => {
    const {
      register,
      formState: { isSubmitting, errors },
    } = useFormContext()

    const [showPassword, setShowPassword] = useState(false)

    const isPassword = type === "password"
    const inputType = isPassword && showPassword ? "text" : type

    const showPasswordLabel = props.showpasswordlabel || "(show)"
    const hidePasswordLabel = props.hidepasswordlabel || "(hide)"

    return (
      <div {...outerProps}>
        <label {...labelProps}>
          {label}
          { isPassword && (
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={
                {
                  cursor: "pointer",
                  marginLeft: "0.5rem"
                }
              }>
              {showPassword ? hidePasswordLabel : showPasswordLabel}
            </span>
          )}
          <div style={{ position: "relative" }}>
            <input 
              disabled={isSubmitting} 
              {...register(name)} 
              {...props} 
              type={inputType}
              style={{ width: "100%" }}
            />
          </div>
        </label>

        <ErrorMessage
          render={({ message }) => (
            <div role="alert" style={{ color: "red" }}>
              {message}
            </div>
          )}
          errors={errors}
          name={name}
        />
      </div>
    )
  }
)

LabeledTextField.displayName = "LabeledTextField"

export interface LabeledTextAreaProps extends PropsWithoutRef<JSX.IntrinsicElements["textarea"]> {
  /** Field name. */
  name: string
  /** Field label. */
  label: string
  outerProps?: PropsWithoutRef<JSX.IntrinsicElements["div"]>
  labelProps?: ComponentPropsWithoutRef<"label">
}

export const LabeledTextArea = forwardRef<HTMLTextAreaElement, LabeledTextAreaProps>(
  ({ label, outerProps, labelProps, name, ...props }, ref) => {
    const {
      register,
      formState: { isSubmitting, errors },
    } = useFormContext()

    return (
      <div {...outerProps}>
        <label {...labelProps}>
          {label}
          <textarea disabled={isSubmitting} {...register(name)} {...props} />
        </label>

        <ErrorMessage
          render={({ message }) => (
            <div role="alert" style={{ color: "red" }}>
              {message}
            </div>
          )}
          errors={errors}
          name={name}
        />

        <style jsx>{`
          label {
            display: flex;
            flex-direction: column;
            align-items: start;
            font-size: 1rem;
          }
          textarea {
            font-size: 1rem;
            padding: 0.25rem 0.5rem;
            border-radius: 3px;
            border: 1px solid purple;
            appearance: none;
            margin-top: 0.5rem;
            min-height: 100px;
            width: 100%;
            resize: vertical;
          }
        `}</style>
      </div>
    )
  }
)

LabeledTextArea.displayName = "LabeledTextArea";

export default LabeledTextField;
