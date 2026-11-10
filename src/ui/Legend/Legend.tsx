import "../base.css";
import "./Legend.css";

export interface LegendItem {
  name: string;
  /** The data/series step, 1 to 6, so a group keeps its color in every view. Defaults to its position. */
  series?: number;
}

const swatch = (item: LegendItem, index: number) => {
  const step = item.series ?? index + 1;
  return step >= 1 && step <= 6 ? String(step) : "other";
};

/** Names each series beside its color, to the side of the plot it explains. */
export function Legend({
  label,
  items,
}: {
  label: string;
  items: LegendItem[];
}) {
  return (
    <ul className="ns-legend" aria-label={label}>
      {items.map((item, index) => (
        <li className="ns-legend-item" key={item.name}>
          <span
            className={`ns-legend-swatch ns-legend-swatch--${swatch(item, index)}`}
            aria-hidden="true"
          />
          {item.name}
        </li>
      ))}
    </ul>
  );
}

interface ColorBarProps {
  label: string;
  scale: "sequential" | "diverging";
  /** End values with their unit, such as “−40.3 dB”. */
  low: string;
  high: string;
}

/** The color scale beside a heat map or spectrogram, with its ends printed. */
export function ColorBar({ label, scale, low, high }: ColorBarProps) {
  return (
    <div
      className="ns-colorbar"
      role="img"
      aria-label={`${label}, from ${low} to ${high}`}
    >
      <span className={`ns-colorbar-ramp ns-colorbar-ramp--${scale}`} />
      <span className="ns-colorbar-high">{high}</span>
      <span className="ns-colorbar-low">{low}</span>
    </div>
  );
}
