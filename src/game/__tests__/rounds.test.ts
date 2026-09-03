import { describe, it, expect } from "vitest";
import { buildRound, shuffle } from "../rounds";
import { EMAILS } from "@/data/emails";

// A tiny seeded RNG for deterministic assertions.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("shuffle", () => {
  it("keeps the same members", () => {
    const arr = [1, 2, 3, 4, 5];
    const out = shuffle(arr, seeded(1));
    expect([...out].sort()).toEqual(arr);
    expect(out).toHaveLength(arr.length);
  });
});

describe("buildRound", () => {
  it("returns the requested size", () => {
    const deck = buildRound(EMAILS, { size: 10, rng: seeded(7) });
    expect(deck).toHaveLength(10);
  });

  it("respects a difficulty filter", () => {
    const deck = buildRound(EMAILS, { size: 6, difficulty: "hard", rng: seeded(3) });
    expect(deck.every((e) => e.difficulty === "hard")).toBe(true);
  });

  it("produces a roughly balanced phishing/legit split", () => {
    const deck = buildRound(EMAILS, { size: 10, rng: seeded(11) });
    const phishing = deck.filter((e) => e.truth === "phishing").length;
    // Balanced within one of half.
    expect(phishing).toBeGreaterThanOrEqual(4);
    expect(phishing).toBeLessThanOrEqual(6);
  });

  it("biases toward focus techniques when requested", () => {
    const deck = buildRound(EMAILS, {
      size: 6,
      focusTechniques: ["attachment_lure"],
      rng: seeded(5),
    });
    const withAttachmentLure = deck.filter((e) =>
      (e.techniqueTags ?? []).includes("attachment_lure"),
    ).length;
    expect(withAttachmentLure).toBeGreaterThan(0);
  });
});

describe("dataset integrity", () => {
  it("has at least 40 emails, each with a snippet and coherent flags", () => {
    expect(EMAILS.length).toBeGreaterThanOrEqual(40);
    for (const e of EMAILS) {
      expect(e.snippet.length).toBeGreaterThan(0);
      if (e.truth === "phishing") expect(e.redFlags.length).toBeGreaterThan(0);
      if (e.truth === "legit") expect((e.legitSignals ?? []).length).toBeGreaterThan(0);
    }
  });

  it("has unique ids", () => {
    const ids = new Set(EMAILS.map((e) => e.id));
    expect(ids.size).toBe(EMAILS.length);
  });
});
