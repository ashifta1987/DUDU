import { describe, expect, it } from "vitest";
import { costInr, type PriceTable } from "./index";

const prices: PriceTable = {
  "acme:tutor-1": { perTokenInInr: 0.0001, perTokenOutInr: 0.0004 },
  "acme:stt-1": { perUnitInr: 0.02 },
};

describe("costInr", () => {
  it("prices token-based usage", () => {
    expect(
      costInr(
        {
          service: "llm_tutor",
          provider: "acme",
          model: "tutor-1",
          units: 0,
          tokensIn: 1000,
          tokensOut: 500,
        },
        prices,
      ),
    ).toBe(0.3);
  });

  it("prices unit-based usage", () => {
    expect(costInr({ service: "stt", provider: "acme", model: "stt-1", units: 12.5 }, prices)).toBe(
      0.25,
    );
  });

  it("returns 0 for unknown models", () => {
    expect(costInr({ service: "tts", provider: "x", model: "y", units: 100 }, prices)).toBe(0);
  });
});
