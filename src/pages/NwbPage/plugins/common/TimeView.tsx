import { TimeOverview, TimeWindow, ViewPanel } from "@ui";
import { FunctionComponent, ReactNode } from "react";
import { useTimeWindow } from "./useTimeWindow";

/** Height the frame takes above the chart: summary, controls and overview. */
export const TIME_VIEW_CHROME = 150;
/** Width the frame takes beside the chart: padding and the plot's border. */
export const TIME_VIEW_INSET = 34;

type Props = {
  label: string;
  summary: string;
  /** The view's own options, after the time window. */
  controls?: ReactNode;
  settings?: ReactNode;
  chartTitle?: string;
  busy?: boolean;
  /** Small views in a combined tab leave out the overview. */
  condensed?: boolean;
  children: ReactNode;
};

/** A view on recording time: the shared time window and overview around Neurosift's chart. */
const TimeView: FunctionComponent<Props> = ({
  label,
  summary,
  controls,
  settings,
  chartTitle,
  busy,
  condensed,
  children,
}) => {
  const time = useTimeWindow();
  return (
    <ViewPanel
      label={label}
      summary={summary}
      busy={busy}
      settings={settings}
      chartTitle={chartTitle}
      controls={
        <>
          <TimeWindow
            value={time.value}
            session={time.session}
            cursor={time.cursor}
            onChange={time.onChange}
          />
          {controls}
        </>
      }
      overview={
        condensed ? undefined : (
          <TimeOverview
            session={time.session}
            value={time.value}
            cursor={time.cursor}
            onChange={time.onChange}
          />
        )
      }
    >
      {children}
    </ViewPanel>
  );
};

export default TimeView;
