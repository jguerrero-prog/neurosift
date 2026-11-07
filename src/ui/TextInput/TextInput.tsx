import { useId, type InputHTMLAttributes } from "react";
import { Icon } from "../Icon/Icon";
import "../field.css";
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
  const messageId = `${id}-message`;
  const message = error ?? helper;
  return (
    <div className={`ns-field ns-field--${size}`}>
      <label className="ns-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="ns-field-box">
        <input
          {...native}
          id={id}
          type={type}
          className="ns-field-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
        />
        {unit && (
          <span className="ns-field-unit" aria-hidden="true">
            {unit}
          </span>
        )}
      </div>
      {message && (
        <p
          id={messageId}
          className={
            error ? "ns-field-message ns-field-error" : "ns-field-message"
          }
        >
          {error && <Icon name="error" />}
          {message}
        </p>
      )}
    </div>
  );
}
