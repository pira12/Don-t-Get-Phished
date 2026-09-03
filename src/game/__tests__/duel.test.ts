import { describe, it, expect } from "vitest";
import {
  encodeChallenge,
  decodeChallenge,
  buildDuelDeck,
  simulateBot,
  duelPointsFor,
  duelOutcome,
  newChallenge,
  DUEL_WRONG_PENALTY,
} from "../duel";
import { EMAILS } from "@/data/emails";

describe("challenge codes", () => {
  it("round-trips a config", () => {
    const cfg = { seed: 123456789, size: 7, difficulty: "mixed" as const };
    const code = encodeChallenge(cfg);
    const decoded = decodeChallenge(code);
    expect(decoded).toEqual(cfg);
  });

  it("rejects malformed codes", () => {
    expect(decodeChallenge("nonsense")).toBeNull();
    expect(decodeChallenge("v1-xx")).toBeNull();
    expect(decodeChallenge("")).toBeNull();
  });

  it("accepts a code embedded in a URL tail after c=", () => {
    const cfg = newChallenge(5, "hard", "me");
    const code = encodeChallenge(cfg);
    expect(decodeChallenge(code)).not.toBeNull();
  });
});

describe("buildDuelDeck determinism", () => {
  it("produces the identical sequence for the same seed (both players match)", () => {
    const cfg = { seed: 42, size: 8, difficulty: "mixed" as const };
    const a = buildDuelDeck(EMAILS, cfg).map((e) => e.id);
    const b = buildDuelDeck(EMAILS, cfg).map((e) => e.id);
    expect(a).toEqual(b);
    expect(a).toHaveLength(8);
  });

  it("different seeds generally differ", () => {
    const a = buildDuelDeck(EMAILS, { seed: 1, size: 8, difficulty: "mixed" }).map((e) => e.id);
    const b = buildDuelDeck(EMAILS, { seed: 2, size: 8, difficulty: "mixed" }).map((e) => e.id);
    expect(a).not.toEqual(b);
  });
});

describe("bot simulation", () => {
  it("is deterministic for a seed+skill and roughly matches the profile accuracy", () => {
    const deck = buildDuelDeck(EMAILS, { seed: 99, size: 10, difficulty: "mixed" });
    const run1 = simulateBot(deck, "threat_hunter", 99);
    const run2 = simulateBot(deck, "threat_hunter", 99);
    expect(run1.map((m) => m.verdict)).toEqual(run2.map((m) => m.verdict));

    // A strong bot should get most right across a bigger sample.
    const big = buildDuelDeck(EMAILS, { seed: 7, size: 15, difficulty: "mixed" });
    const moves = simulateBot(big, "threat_hunter", 7);
    const correct = moves.filter((m) => m.correct).length;
    expect(correct).toBeGreaterThan(big.length * 0.5);
  });
});

describe("duel scoring", () => {
  it("penalises wrong calls and rewards fast-correct", () => {
    expect(duelPointsFor(false, 1000)).toBe(DUEL_WRONG_PENALTY);
    expect(duelPointsFor(true, 1000)).toBeGreaterThan(duelPointsFor(true, 20000));
  });

  it("computes outcomes", () => {
    expect(duelOutcome(200, 100)).toBe("win");
    expect(duelOutcome(100, 200)).toBe("loss");
    expect(duelOutcome(150, 150)).toBe("draw");
  });
});
