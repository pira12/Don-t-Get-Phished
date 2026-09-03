import { describe, it, expect } from "vitest";
import { evaluateAnswer, streakMultiplier, speedBonus, investigationBonus } from "../scoring";
import type { GameEmail } from "../types";

const phishing: GameEmail = {
  id: "t1",
  truth: "phishing",
  difficulty: "hard",
  from: { name: "X", address: "x@bad.example" },
  to: "you@corp.example",
  subject: "s",
  timestamp: "2026-01-01T00:00:00Z",
  snippet: "s",
  bodyHtml: "<p>hi</p>",
  links: [],
  auth: { spf: "fail", dkim: "fail", dmarc: "fail" },
  redFlags: [],
  techniqueTags: ["reply_to_mismatch"],
};

const legit: GameEmail = { ...phishing, id: "t2", truth: "legit", difficulty: "easy", techniqueTags: [] };

describe("streakMultiplier", () => {
  it("starts at 1 and is capped at 1.5", () => {
    expect(streakMultiplier(1)).toBe(1);
    expect(streakMultiplier(2)).toBeCloseTo(1.1);
    expect(streakMultiplier(100)).toBe(1.5);
  });
});

describe("speedBonus / investigationBonus", () => {
  it("only rewards correct answers", () => {
    expect(speedBonus(1000, false)).toBe(0);
    expect(investigationBonus(5, false)).toBe(0);
  });
  it("rewards fast answers and caps investigation at two tools", () => {
    expect(speedBonus(3000, true)).toBe(30);
    expect(speedBonus(30000, true)).toBe(0);
    expect(investigationBonus(5, true)).toBe(30);
  });
});

describe("evaluateAnswer", () => {
  it("scores a correct hard call with bonuses and grows the streak", () => {
    const r = evaluateAnswer({
      email: phishing,
      verdict: "phishing",
      elapsedMs: 4000,
      toolsUsed: 2,
      currentStreak: 0,
    });
    expect(r.correct).toBe(true);
    expect(r.newStreak).toBe(1);
    // base 100 + difficulty 60 + speed 30 + investigation 30 = 220, streak x1 => 220
    expect(r.points).toBe(220);
    expect(r.falsePositive).toBe(false);
    expect(r.falseNegative).toBe(false);
  });

  it("classifies a wrong call on legit mail as a false positive with zero points", () => {
    const r = evaluateAnswer({
      email: legit,
      verdict: "phishing",
      elapsedMs: 2000,
      toolsUsed: 0,
      currentStreak: 5,
    });
    expect(r.correct).toBe(false);
    expect(r.points).toBe(0);
    expect(r.falsePositive).toBe(true);
    expect(r.newStreak).toBe(0);
  });

  it("classifies a missed phishing as a false negative", () => {
    const r = evaluateAnswer({
      email: phishing,
      verdict: "legit",
      elapsedMs: 2000,
      toolsUsed: 0,
      currentStreak: 3,
    });
    expect(r.falseNegative).toBe(true);
    expect(r.correct).toBe(false);
  });

  it("applies a gentle streak bonus on a continued streak", () => {
    const r = evaluateAnswer({
      email: legit,
      verdict: "legit",
      elapsedMs: 30000, // no speed bonus
      toolsUsed: 0,
      currentStreak: 1, // becomes 2 -> x1.1
    });
    // base 100, easy diff bonus 0, subtotal 100, x1.1 => streakBonus 10, points 110
    expect(r.points).toBe(110);
    expect(r.breakdown.streakBonus).toBe(10);
  });
});
