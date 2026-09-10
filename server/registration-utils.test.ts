import { describe, expect, it } from "vitest";
import { calculateRegistrationAmount, normalizePhone } from "./registration-utils";

describe("registration utilities", () => {
  it("calculates male and female participation totals", () => {
    expect(calculateRegistrationAmount("male", 2)).toBe(110_000);
    expect(calculateRegistrationAmount("female", 3)).toBe(105_000);
  });

  it("normalizes Korean mobile phone numbers", () => {
    expect(normalizePhone("010-1234-5678")).toBe("01012345678");
  });
});
