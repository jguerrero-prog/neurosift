import { useLayoutEffect, useRef, type ReactNode } from "react";
import {
  DescriptionList,
  type Description,
} from "../DescriptionList/DescriptionList";
import { IconButton } from "../IconButton/IconButton";
import { PanelResizer } from "../PanelResizer/PanelResizer";
import "../base.css";
import "./OverviewPanel.css";

const PANEL_MIN = 240;
const PANEL_MAX = 480;

interface OverviewPanelProps {
  title: string;
  groups: { title: string; items: Description[] }[];
  /** Anything after the groups, such as a description in a Disclosure. */
  children?: ReactNode;
  width: number;
  onWidthChange: (width: number) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const clamp = (width: number) =>
  Math.min(PANEL_MAX, Math.max(PANEL_MIN, width));
const lower = (title: string) => title[0].toLowerCase() + title.slice(1);

/** The panel on the left of the file viewer: what the session is, resizable and collapsible to a rail. */
export function OverviewPanel({
  title,
  groups,
  children,
  width,
  onWidthChange,
  collapsed,
  onCollapsedChange,
}: OverviewPanelProps) {
  const panel = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    panel.current?.style.setProperty(
      "--ns-overview-panel-width",
      `${clamp(width)}px`,
    );
  }, [width, collapsed]);

  if (collapsed)
    return (
      <div className="ns-overview-panel-rail">
        <IconButton
          icon="chevron--right"
          label={`Show ${lower(title)}`}
          variant="ghost"
          size="sm"
          tooltipPlacement="right"
          onClick={() => onCollapsedChange(false)}
        />
      </div>
    );

  return (
    <section ref={panel} className="ns-overview-panel" aria-label={title}>
      <div className="ns-overview-panel-scroll">
        <div className="ns-overview-panel-header">
          <p className="ns-overview-panel-title">{title}</p>
          <IconButton
            icon="chevron--left"
            label={`Hide ${lower(title)}`}
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange(true)}
          />
        </div>
        {groups.map((group) => (
          <div className="ns-overview-panel-group" key={group.title}>
            <p className="ns-overview-panel-group-title">{group.title}</p>
            <DescriptionList label={group.title} items={group.items} />
          </div>
        ))}
        {children}
      </div>
      <PanelResizer
        label={`Resize ${lower(title)}`}
        width={width}
        min={PANEL_MIN}
        max={PANEL_MAX}
        onWidthChange={onWidthChange}
      />
    </section>
  );
}
