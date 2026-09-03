import { describe, it, expect } from "vitest";
import { levelForXp, tierForLevel, xpForLevel } from "../xp";

describe("xp curve", () => {
  it("level 1 needs 0 xp and levels grow monotonically", () => {
    expect(xpForLevel(1)).toBe(0);
    for (let n = 1; n < 30; n++) {
      expect(xpForLevel(n + 1)).toBeGreaterThan(xpForLevel(n));
    }
  });

  it("levelForXp reports progress inside the current level", () => {
    const info = levelForXp(0);
    expect(info.level).toBe(1);
    expect(info.progress).toBeGreaterThanOrEqual(0);
    expect(info.progress).toBeLessThan(1);
  });

  it("higher xp yields a higher (or equal) level", () => {
    expect(levelForXp(5000).level).toBeGreaterThan(levelForXp(100).level);
  });
});

describe("tiers", () => {
  it("maps early levels to Bronze and very high levels to Threat Hunter", () => {
    expect(tierForLevel(1).name).toBe("Bronze");
    expect(tierForLevel(30).name).toBe("Threat Hunter");
  });
});
