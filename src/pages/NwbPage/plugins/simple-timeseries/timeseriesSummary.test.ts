import { describe, expect, it } from "vitest";
import { timeseriesSummary } from "./timeseriesSummary";

describe("timeseriesSummary", () => {
  it("gives the span, rate and channels", () => {
    expect(
      timeseriesSummary({
        totalNumChannels: 70,
        samplingFrequency: 400,
        timeseriesStartTime: 0,
        timeseriesDuration: 1375.69,
      }),
    ).toBe("0.00–1,375.69 s · 400 Hz · 70 channels");
  });
});
