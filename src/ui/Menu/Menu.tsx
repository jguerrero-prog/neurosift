import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "../Button/Button";
import type { IconName } from "../Icon/Icon";
import "./Menu.css";

export interface MenuItem {
  label: string;
  meta?: string;
  disabled?: boolean;
  onSelect: () => void;
}

interface MenuProps {
  label: string;
  items: MenuItem[];
  icon?: IconName;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const STEPS: Record<string, (i: number, n: number) => number> = {
  ArrowDown: (i, n) => (i + 1) % n,
  ArrowUp: (i, n) => (i - 1 + n) % n,
  Home: () => 0,
  End: (_, n) => n - 1,
};

/** A button that opens a list of actions, built on the browser's popover. */
export function Menu({
  label,
  items,
  icon,
  variant = "secondary",
  size = "md",
}: MenuProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const enabled = () => [
    ...list.current!.querySelectorAll<HTMLButtonElement>(
      ".ns-menu-item:not(:disabled)",
    ),
  ];
  const trigger = () =>
    root.current!.querySelector<HTMLButtonElement>(":scope > button");

  useEffect(() => {
    const menu = list.current!;
    const onToggle = (event: Event) => {
      const opened = (event as ToggleEvent).newState === "open";
      setOpen(opened);
      if (opened) enabled()[0]?.focus();
      // Escape, a pick or Tab leave focus inside or nowhere; send it back to the button.
      else if (
        menu.contains(document.activeElement) ||
        document.activeElement === document.body
      )
        trigger()?.focus();
    };
    menu.addEventListener("toggle", onToggle);
    return () => menu.removeEventListener("toggle", onToggle);
  }, []);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Tab") return list.current!.hidePopover();
    const step = STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    const all = enabled();
    const current = all.indexOf(document.activeElement as HTMLButtonElement);
    all[step(current, all.length)]?.focus();
  };

  return (
    <div className="ns-menu" ref={root}>
      <Button
        variant={variant}
        size={size}
        icon={icon}
        popovertarget={id}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
      </Button>
      <div
        id={id}
        ref={list}
        popover="auto"
        role="menu"
        aria-label={label}
        className={`ns-menu-list ns-menu-list--${size}`}
        onKeyDown={onKeyDown}
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            tabIndex={-1}
            className="ns-menu-item"
            disabled={item.disabled}
            onClick={() => {
              item.onSelect();
              list.current!.hidePopover();
            }}
          >
            {item.label}
            {item.meta && <span className="ns-menu-meta">{item.meta}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
