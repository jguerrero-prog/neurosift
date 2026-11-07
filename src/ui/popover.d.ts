// React 18's types predate the popover attributes; React passes lowercase attributes through.
import "react";

declare module "react" {
  interface HTMLAttributes<T> extends DOMAttributes<T> {
    popover?: "auto" | "manual";
  }
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    popovertarget?: string;
  }
}
