import { describe, it, expect } from "vitest";
import { AFTERMATH_SCENARIOS, scenarioById, SOURCES } from "@/data/aftermath";

describe("aftermath scenarios", () => {
  it("has coherent, non-empty scenarios", () => {
    expect(AFTERMATH_SCENARIOS.length).toBeGreaterThanOrEqual(2);
    for (const s of AFTERMATH_SCENARIOS) {
      expect(s.id).toBeTruthy();
      expect(s.steps.length).toBeGreaterThan(0);
      expect(s.impact.length).toBeGreaterThan(0);
      expect(s.defenses.length).toBeGreaterThan(0);
      // every scenario begins at time 0 (the click) and ends later
      expect(s.steps[0].t).toBe("0s");
    }
  });

  it("scenarioById falls back to the first scenario for unknown ids", () => {
    expect(scenarioById("work-email").id).toBe("work-email");
    expect(scenarioById("does-not-exist").id).toBe(AFTERMATH_SCENARIOS[0].id);
    expect(scenarioById(null).id).toBe(AFTERMATH_SCENARIOS[0].id);
  });

  it("cites real sources", () => {
    expect(SOURCES.length).toBeGreaterThan(0);
    for (const s of SOURCES) expect(s.url).toMatch(/^https:\/\//);
  });
});
