import { describe, it, expect } from "vitest";
import { mulberry32, hashString, dateSeed } from "../rng";

describe("mulberry32", () => {
  it("is deterministic and in [0,1)", () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("differs across seeds", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe("hashString / dateSeed", () => {
  it("is stable and unsigned 32-bit", () => {
    expect(hashString("hello")).toBe(hashString("hello"));
    expect(hashString("hello")).toBeGreaterThanOrEqual(0);
    expect(dateSeed("2026-09-03")).toBe(dateSeed("2026-09-03"));
    expect(dateSeed("2026-09-03")).not.toBe(dateSeed("2026-09-04"));
  });
});
