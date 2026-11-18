import { describe, expect, it } from "vitest";
import { formatIndianPhone, toIndianE164 } from "./phone";

describe("toIndianE164", () => {
  it("accepts common Indian formats", () => {
    for (const v of [
      "9876543210",
      "98765 43210",
      "+91 98765 43210",
      "919876543210",
      "09876543210",
      "+91-98765-43210",
    ]) {
      expect(toIndianE164(v)).toBe("+919876543210");
    }
  });
  it("rejects invalid numbers", () => {
    for (const v of ["", "12345", "5876543210", "98765432101", "+1 415 555 0100"]) {
      expect(toIndianE164(v)).toBeNull();
    }
  });
  it("formats for display", () => {
    expect(formatIndianPhone("+919876543210")).toBe("+91 98765 43210");
  });
});
