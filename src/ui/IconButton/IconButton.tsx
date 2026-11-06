import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "../Icon/Icon";
import "../control.css";
import "./IconButton.css";

interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "style" | "children" | "aria-label"
> {
  icon: IconName;
  label: string;
  variant?: "secondary" | "ghost";
  size?: "md" | "sm";
}

export function IconButton({
  icon,
  label,
  variant = "secondary",
  size = "md",
  type = "button",
  ...native
}: IconButtonProps) {
  return (
    <button
      {...native}
      type={type}
      aria-label={label}
      className={`ns-icon-button ns-icon-button--${variant} ns-icon-button--${size}`}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
