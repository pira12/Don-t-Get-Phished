import { describe, it, expect } from "vitest";
import { ALL_SCENARIOS, SCENARIOS_BY_CHANNEL } from "@/data/scenarios";
import { TECHNIQUE_LABELS } from "@/game/types";
import { buildMixedRound } from "@/game/rounds";

describe("scenario datasets", () => {
  it("have unique ids", () => {
    const ids = ALL_SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each channel has both phishing and legit examples", () => {
    for (const [channel, list] of Object.entries(SCENARIOS_BY_CHANNEL)) {
      expect(list.length, channel).toBeGreaterThanOrEqual(4);
      expect(list.some((s) => s.truth === "phishing"), `${channel} phishing`).toBe(true);
      expect(list.some((s) => s.truth === "legit"), `${channel} legit`).toBe(true);
    }
  });

  it("phishing scenarios carry red flags with known techniques; legit ones carry signals", () => {
    for (const s of ALL_SCENARIOS) {
      if (s.truth === "phishing") {
        expect(s.redFlags.length, s.id).toBeGreaterThan(0);
        for (const f of s.redFlags) expect(TECHNIQUE_LABELS[f.type], `${s.id}:${f.type}`).toBeTruthy();
      } else {
        expect((s.legitSignals ?? []).length, s.id).toBeGreaterThan(0);
        expect(s.redFlags.length, s.id).toBe(0);
      }
    }
  });

  it("the channel field matches which bucket a scenario is in", () => {
    for (const [channel, list] of Object.entries(SCENARIOS_BY_CHANNEL)) {
      for (const s of list) expect(s.channel, s.id).toBe(channel);
    }
  });

  it("builds a balanced mixed round across channels", () => {
    let seed = 7;
    const rng = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const deck = buildMixedRound(
      Object.values(SCENARIOS_BY_CHANNEL),
      { size: 10, rng },
    );
    expect(deck.length).toBe(10);
    // more than one channel represented
    expect(new Set(deck.map((s) => s.channel)).size).toBeGreaterThan(1);
  });
});
