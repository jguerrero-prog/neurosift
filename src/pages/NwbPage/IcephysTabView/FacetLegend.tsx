import { useCssVars } from "@components/useCssVars";
import { FunctionComponent } from "react";
import { GroupBy, groupOf } from "./FamilyOverlayPlot";
import { categorical } from "./palette";
import { LoadedSweep } from "./useSweepData";

// Shared color assignment for a faceted view's inner-color axis. Computed once
// over all sweeps (global first-appearance order) so every panel and this legend
// use the same color for the same group. Categorical only; the per-sweep
// gradient is handled separately (each panel uses its own hue).
export function facetColors(
  sweeps: LoadedSweep[],
  axis: GroupBy,
): {
  order: number[];
  labelOf: Map<number, string>;
  colorOf: Map<number, string>;
} {
  const order: number[] = [];
  const labelOf = new Map<number, string>();
  for (const sw of sweeps) {
    const g = groupOf(sw, axis);
    if (!labelOf.has(g.id)) {
      order.push(g.id);
      labelOf.set(g.id, g.label);
    }
  }
  const colorOf = new Map<number, string>();
  order.forEach((id, i) => colorOf.set(id, categorical(i)));
  return { order, labelOf, colorOf };
}

type Categorical = ReturnType<typeof facetColors>;

/** One swatch in the trace's own color, which the chart picks at run time. */
const Swatch: FunctionComponent<{ color: string }> = ({ color }) => {
  const ref = useCssVars<HTMLSpanElement>({ "--icephys-swatch": color });
  return <span ref={ref} className="icephys-swatch" aria-hidden="true" />;
};

/** Names each group beside the color its traces are drawn in. */
const FacetLegend: FunctionComponent<{
  label: string;
  categorical: Categorical;
}> = ({ label, categorical }) => {
  if (categorical.order.length === 0) return null;
  return (
    <ul className="icephys-legend" aria-label={label}>
      {categorical.order.map((id) => (
        <li key={id} className="icephys-legend-item">
          <Swatch color={categorical.colorOf.get(id) ?? ""} />
          {categorical.labelOf.get(id)}
        </li>
      ))}
    </ul>
  );
};

export default FacetLegend;
