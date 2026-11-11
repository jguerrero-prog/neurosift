// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  advanceWindow,
  atEnd,
  framesDue,
  isPlaybackKey,
  sameWindow,
  settleWindow,
} from "./playback";

const SESSION = { start: 0, end: 100 };

describe("advanceWindow", () => {
  it("moves the window forward by the elapsed seconds, keeping its length", () => {
    expect(advanceWindow({ start: 10, duration: 4 }, SESSION, 0.5)).toEqual({
      value: { start: 10.5, duration: 4 },
      ended: false,
    });
  });

  it("stops with the window's right edge on the session's end", () => {
    expect(advanceWindow({ start: 95, duration: 4 }, SESSION, 3)).toEqual({
      value: { start: 96, duration: 4 },
      ended: true,
    });
  });
});

describe("atEnd", () => {
  it("is true once the right edge reaches the end", () => {
    expect(atEnd({ start: 96, duration: 4 }, SESSION)).toBe(true);
    expect(atEnd({ start: 95.9, duration: 4 }, SESSION)).toBe(false);
  });
});

describe("sameWindow", () => {
  it("ignores floating-point noise but not a real move", () => {
    expect(
      sameWindow(
        { start: 0.1 + 0.2, duration: 1 },
        { start: 0.3, duration: 1 },
      ),
    ).toBe(true);
    expect(
      sameWindow({ start: 0.3, duration: 1 }, { start: 0.31, duration: 1 }),
    ).toBe(false);
  });
});

describe("settleWindow", () => {
  const a = { start: 1, duration: 2 };
  const b = { start: 2, duration: 2 };
  const c = { start: 3, duration: 2 };

  it("drops windows playback set before the one now shown", () => {
    expect(settleWindow([a, b, c], b)).toEqual({
      pending: [b, c],
      external: false,
    });
  });

  it("calls a window playback never set an outside edit", () => {
    expect(settleWindow([a, b], { start: 50, duration: 2 })).toEqual({
      pending: [],
      external: true,
    });
  });

  it("has nothing to compare before playback sets a window", () => {
    expect(settleWindow([], a)).toEqual({ pending: [], external: false });
  });
});

describe("framesDue", () => {
  it("steps whole frames at the series' rate and carries the rest", () => {
    const first = framesDue(0, 0.05, 30);
    expect(first.steps).toBe(1);
    expect(first.carry).toBeCloseTo(0.5);
    const next = framesDue(0.5, 0.02, 30);
    expect(next.steps).toBe(1);
    expect(next.carry).toBeCloseTo(0.1);
    expect(framesDue(0, 0.01, 30).steps).toBe(0);
  });
});

describe("isPlaybackKey", () => {
  it("takes Space, except in a control that uses it", () => {
    const div = document.createElement("div");
    const button = document.createElement("button");
    expect(isPlaybackKey(" ", div)).toBe(true);
    expect(isPlaybackKey("Enter", div)).toBe(false);
    expect(isPlaybackKey(" ", button)).toBe(false);
  });
});
