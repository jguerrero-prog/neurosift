import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { IconSource, OUTPUT, SOURCE } from "./build.mjs";

// The Carbon equivalents of the MUI icons the app uses today (Figma Iconography, replacement map).
const MUI_REPLACEMENTS = [
  "search",
  "close",
  "share",
  "copy",
  "launch",
  "download",
  "recently-viewed",
  "settings",
  "reset",
  "chevron--left",
  "chevron--right",
  "play",
  "pause",
  "stop",
  "skip--back",
  "logo--github",
];

// Icons the components draw themselves: status icons, checkbox marks, chevrons, carets and the info button.
const COMPONENT_ICONS = [
  "error",
  "checkmark",
  "subtract",
  "chevron--down",
  "information",
  "checkmark--outline",
  "warning--alt",
  "caret--right",
  "caret--down",
];

const icons = IconSource.load(SOURCE);

describe("icons", () => {
  it("holds the MUI replacements and the icons components draw, nothing else", () => {
    expect(Object.keys(icons).sort()).toEqual(
      [...MUI_REPLACEMENTS, ...COMPONENT_ICONS].sort(),
    );
  });

  it("matches the committed icons.ts", () => {
    expect(readFileSync(OUTPUT, "utf8")).toBe(IconSource.module(icons));
  });

  it("keeps even-odd fills, which the GitHub mark needs", () => {
    expect(icons["logo--github"][0].evenOdd).toBe(true);
    expect(icons.search.every((path) => path.evenOdd === undefined)).toBe(true);
  });

  it("rejects markup it can't draw, instead of dropping it", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="4"/></svg>';
    expect(() => IconSource.parse("dot", svg)).toThrow(
      "dot: unsupported markup",
    );
  });

  it("rejects icons that aren't on the 32px grid", () => {
    expect(() =>
      IconSource.parse("small", '<svg viewBox="0 0 16 16"></svg>'),
    ).toThrow("small: expected a 32px Carbon icon");
  });
});
