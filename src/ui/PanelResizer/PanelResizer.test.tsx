// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PanelResizer } from "./PanelResizer";

afterEach(cleanup);

const setup = (width: number) => {
  const onWidthChange = vi.fn<(width: number) => void>();
  render(
    <PanelResizer
      label="Resize regions"
      width={width}
      min={240}
      max={480}
      onWidthChange={onWidthChange}
    />,
  );
  return {
    edge: screen.getByRole("separator", { name: "Resize regions" }),
    onWidthChange,
  };
};

describe("PanelResizer", () => {
  it("is a vertical separator that says its width and range", () => {
    const { edge } = setup(320);
    expect(edge.getAttribute("aria-orientation")).toBe("vertical");
    expect(edge.getAttribute("aria-valuenow")).toBe("320");
    expect(edge.getAttribute("aria-valuemin")).toBe("240");
    expect(edge.getAttribute("aria-valuemax")).toBe("480");
  });

  it("moves 16px per arrow key and jumps with Home and End, within its range", () => {
    const { edge, onWidthChange } = setup(470);
    fireEvent.keyDown(edge, { key: "ArrowRight" });
    expect(onWidthChange).toHaveBeenLastCalledWith(480);
    fireEvent.keyDown(edge, { key: "ArrowLeft" });
    expect(onWidthChange).toHaveBeenLastCalledWith(454);
    fireEvent.keyDown(edge, { key: "Home" });
    expect(onWidthChange).toHaveBeenLastCalledWith(240);
    fireEvent.keyDown(edge, { key: "End" });
    expect(onWidthChange).toHaveBeenLastCalledWith(480);
  });
});
