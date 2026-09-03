import { describe, it, expect } from "vitest";
import {
  buildLeaderboard,
  buildAllTimeLeaderboard,
  rankScore,
  sinceForTimeframe,
  weaknessHeatmap,
  orgOverview,
} from "@/server/leaderboard";
import type { RoundEvent, UserStats } from "@/server/types";

function evt(p: Partial<RoundEvent>): RoundEvent {
  return {
    id: Math.random().toString(36),
    userId: "u1",
    orgId: null,
    at: new Date().toISOString(),
    difficulty: "mixed",
    total: 10,
    correct: 8,
    points: 800,
    falsePositives: 1,
    falseNegatives: 1,
    techniqueSeen: {},
    techniqueCaught: {},
    ...p,
  };
}

describe("rankScore", () => {
  it("scales points by accuracy so grinding can't top careful play", () => {
    // Grinder: lots of points at 50% accuracy.
    const grinder = rankScore(2000, 100, 50); // *0.75 => 1500
    // Expert: fewer points but perfect accuracy.
    const expert = rankScore(1700, 40, 40); // *1.0 => 1700
    expect(expert).toBeGreaterThan(grinder);
  });
  it("is zero with no answers", () => {
    expect(rankScore(500, 0, 0)).toBe(0);
  });
});

describe("buildLeaderboard", () => {
  it("aggregates per user and ranks by rankScore", () => {
    const rows = buildLeaderboard([
      evt({ userId: "a", points: 500, total: 10, correct: 5 }),
      evt({ userId: "a", points: 500, total: 10, correct: 5 }),
      evt({ userId: "b", points: 900, total: 10, correct: 10 }),
    ]);
    expect(rows[0].userId).toBe("b"); // perfect accuracy wins
    expect(rows.find((r) => r.userId === "a")!.answered).toBe(20);
    expect(rows[0].rank).toBe(1);
    expect(rows[1].rank).toBe(2);
  });
});

describe("buildAllTimeLeaderboard", () => {
  it("ranks user stat mirrors", () => {
    const stats: UserStats[] = [
      { userId: "a", xp: 1000, totalAnswered: 100, totalCorrect: 60, falsePositives: 10, falseNegatives: 30, bestStreak: 5, techniqueSeen: {}, techniqueCaught: {}, lastActive: "x" },
      { userId: "b", xp: 900, totalAnswered: 50, totalCorrect: 50, falsePositives: 0, falseNegatives: 0, bestStreak: 9, techniqueSeen: {}, techniqueCaught: {}, lastActive: "x" },
    ];
    const rows = buildAllTimeLeaderboard(stats);
    expect(rows[0].userId).toBe("b"); // 900*1.0 = 900 > 1000*0.8 = 800
  });
});

describe("sinceForTimeframe", () => {
  it("returns a bound for week/season and undefined for all", () => {
    const now = new Date("2026-09-15T12:00:00Z");
    expect(sinceForTimeframe("week", now)!).toBe(new Date("2026-09-08T12:00:00Z").toISOString());
    expect(sinceForTimeframe("season", now)!.slice(0, 10)).toBe("2026-09-01");
    expect(sinceForTimeframe("all", now)).toBeUndefined();
  });
});

describe("weaknessHeatmap", () => {
  it("ranks techniques by miss rate", () => {
    const events = [
      evt({ techniqueSeen: { urgency: 10, lookalike_domain: 10 }, techniqueCaught: { urgency: 2, lookalike_domain: 9 } }),
    ];
    const heat = weaknessHeatmap(events);
    expect(heat[0].technique).toBe("urgency"); // 80% missed, ranked first
    expect(heat[0].missRate).toBeCloseTo(0.8);
  });
});

describe("orgOverview", () => {
  it("summarises active users, rounds, and accuracy", () => {
    const ov = orgOverview([
      evt({ userId: "a", total: 10, correct: 8 }),
      evt({ userId: "b", total: 10, correct: 6 }),
    ]);
    expect(ov.activeUsers).toBe(2);
    expect(ov.totalRounds).toBe(2);
    expect(ov.avgAccuracy).toBeCloseTo(0.7);
  });
});
