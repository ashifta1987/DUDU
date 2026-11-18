import { describe, expect, it } from "vitest";
import { formatClock, greetingKey, istHour, wifiQuality } from "./format";

describe("format", () => {
  it("formats clock times", () => {
    expect(formatClock("16:30:00", "en").toLowerCase().replace(/\s/g, " ")).toBe("4:30 pm");
    expect(formatClock("09:05", "hi")).toMatch(/9:05/);
  });
  it("uses IST for greetings", () => {
    expect(istHour(new Date("2026-11-18T03:30:00Z"))).toBe(9);
    expect(greetingKey(9)).toBe("greetingMorning");
    expect(greetingKey(14)).toBe("greetingAfternoon");
    expect(greetingKey(19)).toBe("greetingEvening");
  });
  it("buckets wifi signal", () => {
    expect(wifiQuality(-54)).toBe("wifiStrong");
    expect(wifiQuality(-67)).toBe("wifiGood");
    expect(wifiQuality(-81)).toBe("wifiWeak");
    expect(wifiQuality(null)).toBeNull();
  });
});
