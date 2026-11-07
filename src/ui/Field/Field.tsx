import type { ReactNode } from "react";
import { Icon } from "../Icon/Icon";
import "../field.css";
import { fieldMessageId } from "./fieldAria";

interface FieldProps {
  id: string;
  label: string;
  size: "md" | "sm";
  helper?: string;
  error?: string;
  children: ReactNode;
}

/** The label, frame and message every form field shares; the control goes inside. */
export function Field({
  id,
  label,
  size,
  helper,
  error,
  children,
}: FieldProps) {
  const message = error ?? helper;
  return (
    <div className={`ns-field ns-field--${size}`}>
      <label className="ns-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="ns-field-box">{children}</div>
      {message && (
        <p
          id={fieldMessageId(id)}
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
