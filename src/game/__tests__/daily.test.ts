import { describe, it, expect } from "vitest";
import { buildDailyDeck, DAILY_SIZE } from "../daily";
import { EMAILS } from "@/data/emails";

describe("daily challenge", () => {
  it("is identical for everyone on the same date", () => {
    const a = buildDailyDeck(EMAILS, "2026-09-03").map((e) => e.id);
    const b = buildDailyDeck(EMAILS, "2026-09-03").map((e) => e.id);
    expect(a).toEqual(b);
    expect(a).toHaveLength(DAILY_SIZE);
  });

  it("changes from day to day", () => {
    const a = buildDailyDeck(EMAILS, "2026-09-03").map((e) => e.id);
    const b = buildDailyDeck(EMAILS, "2026-09-04").map((e) => e.id);
    expect(a).not.toEqual(b);
  });
});
