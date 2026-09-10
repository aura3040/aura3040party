import { describe, expect, it } from "vitest";
import {
  assertEventDateAllowed,
  calculateRegistrationAmount,
  getKstDateString,
  normalizePhone,
} from "./registration-utils";

describe("registration utilities", () => {
  it("calculates male and female participation totals", () => {
    expect(calculateRegistrationAmount("male", 2)).toBe(110_000);
    expect(calculateRegistrationAmount("female", 3)).toBe(105_000);
  });

  it("normalizes Korean mobile phone numbers", () => {
    expect(normalizePhone("010-1234-5678")).toBe("01012345678");
  });

  it("allows today's KST weekday even when server clock is UTC afternoon", () => {
    // 2026-09-10 is Thursday in Seoul; UTC evening of Sep 9 is already Sep 10 KST
    const utcEvening = new Date("2026-09-09T16:00:00.000Z");
    expect(getKstDateString(utcEvening)).toBe("2026-09-10");
    expect(assertEventDateAllowed("2026-09-10", utcEvening).ok).toBe(true);
  });

  it("rejects Sunday and past dates in KST", () => {
    const now = new Date("2026-09-10T01:00:00.000Z");
    expect(assertEventDateAllowed("2026-09-13", now).ok).toBe(false); // Sunday
    expect(assertEventDateAllowed("2026-09-09", now).ok).toBe(false); // past
  });
});
