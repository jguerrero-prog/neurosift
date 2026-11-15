import type { KeyboardEvent, PointerEvent } from "react";
import "../base.css";
import "./PanelResizer.css";

interface PanelResizerProps {
  /** Names the edge, such as "Resize overview". */
  label: string;
  width: number;
  min: number;
  max: number;
  /** How far an arrow key moves the edge, in pixels. */
  step?: number;
  onWidthChange: (width: number) => void;
}

/**
 * The draggable inline-end edge of a side panel: a separator that the pointer drags and the arrow keys,
 * Home and End move. Place it last inside a positioned panel; it measures from the panel's start edge.
 */
export function PanelResizer({
  label,
  width,
  min,
  max,
  step = 16,
  onWidthChange,
}: PanelResizerProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  const onKey = (event: KeyboardEvent) => {
    const next = {
      ArrowLeft: width - step,
      ArrowRight: width + step,
      Home: min,
      End: max,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onWidthChange(clamp(next));
  };

  const onDrag = (event: PointerEvent<HTMLDivElement>) => {
    const handle = event.currentTarget;
    const left = handle.parentElement?.getBoundingClientRect().left ?? 0;
    handle.setPointerCapture(event.pointerId);
    const move = (moved: globalThis.PointerEvent) =>
      onWidthChange(clamp(moved.clientX - left));
    const stop = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", stop);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop);
  };

  return (
    <div
      className="ns-panel-resizer"
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      aria-valuenow={clamp(width)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onKeyDown={onKey}
      onPointerDown={onDrag}
    />
  );
}
