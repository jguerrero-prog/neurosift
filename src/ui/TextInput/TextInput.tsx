import { useId, type InputHTMLAttributes } from "react";
import { Field } from "../Field/Field";
import { fieldAria } from "../Field/fieldAria";
import "./TextInput.css";

interface TextInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "style" | "size" | "value" | "onChange" | "type" | "id"
> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  size?: "md" | "sm";
  type?: "text" | "password" | "url" | "email";
  helper?: string;
  error?: string;
  unit?: string;
}

export function TextInput({
  label,
  value,
  onChange,
  size = "md",
  type = "text",
  helper,
  error,
  unit,
  ...native
}: TextInputProps) {
  const id = useId();
  return (
    <Field id={id} label={label} size={size} helper={helper} error={error}>
      <input
        {...native}
        id={id}
        type={type}
        className="ns-field-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...fieldAria(id, helper, error)}
      />
      {unit && (
        <span className="ns-field-unit" aria-hidden="true">
          {unit}
        </span>
      )}
    </Field>
  );
}
