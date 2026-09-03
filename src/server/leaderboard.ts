/**
 * Pure leaderboard + aggregation logic. No IO — unit-tested and reused by the API.
 * Ranking rewards accuracy and difficulty, NOT raw volume, so grinding easy emails
 * can't top a careful expert. Accuracy and false-positive rate ride alongside XP so
 * the signal stays honest.
 */

import type { RedFlagType } from "@/game/types";
import type { RoundEvent, TechniqueCounts, UserStats } from "./types";

export type Timeframe = "week" | "season" | "all";

export function sinceForTimeframe(tf: Timeframe, now = new Date()): string | undefined {
  if (tf === "week") return new Date(now.getTime() - 7 * 86_400_000).toISOString();
  if (tf === "season") return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  return undefined; // all-time
}

export type LeaderboardRow = {
  userId: string;
  points: number;
  answered: number;
  correct: number;
  accuracy: number; // 0..1
  falsePositiveRate: number; // 0..1
  rankScore: number;
  rank: number;
};

/**
 * Rank score: total points scaled by an accuracy factor so careful play beats
 * volume. A player at 50% accuracy keeps ~75% of their points; 100% keeps all.
 */
export function rankScore(points: number, answered: number, correct: number): number {
  if (answered === 0) return 0;
  const accuracy = correct / answered;
  return Math.round(points * (0.5 + 0.5 * accuracy));
}

type Agg = {
  points: number;
  answered: number;
  correct: number;
  falsePositives: number;
};

/** Build a ranked leaderboard from time-boxed round events. */
export function buildLeaderboard(events: RoundEvent[]): LeaderboardRow[] {
  const byUser = new Map<string, Agg>();
  for (const e of events) {
    const a = byUser.get(e.userId) ?? { points: 0, answered: 0, correct: 0, falsePositives: 0 };
    a.points += e.points;
    a.answered += e.total;
    a.correct += e.correct;
    a.falsePositives += e.falsePositives;
    byUser.set(e.userId, a);
  }

  const rows: LeaderboardRow[] = [...byUser.entries()].map(([userId, a]) => ({
    userId,
    points: a.points,
    answered: a.answered,
    correct: a.correct,
    accuracy: a.answered ? a.correct / a.answered : 0,
    falsePositiveRate: a.answered ? a.falsePositives / a.answered : 0,
    rankScore: rankScore(a.points, a.answered, a.correct),
    rank: 0,
  }));

  rows.sort((x, y) => y.rankScore - x.rankScore || y.accuracy - x.accuracy);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

/** All-time leaderboard from the user stat mirrors (xp + lifetime accuracy). */
export function buildAllTimeLeaderboard(stats: UserStats[]): LeaderboardRow[] {
  const rows: LeaderboardRow[] = stats.map((s) => ({
    userId: s.userId,
    points: s.xp,
    answered: s.totalAnswered,
    correct: s.totalCorrect,
    accuracy: s.totalAnswered ? s.totalCorrect / s.totalAnswered : 0,
    falsePositiveRate: s.totalAnswered ? s.falsePositives / s.totalAnswered : 0,
    rankScore: rankScore(s.xp, s.totalAnswered, s.totalCorrect),
    rank: 0,
  }));
  rows.sort((x, y) => y.rankScore - x.rankScore || y.accuracy - x.accuracy);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

// --- org weakness heatmap -----------------------------------------------------

export type TechniqueStat = { technique: RedFlagType; seen: number; caught: number; missRate: number };

/** Aggregate per-technique miss rates across an org's round events — the single
 * most valuable admin screen (where real-world risk sits). */
export function weaknessHeatmap(events: RoundEvent[]): TechniqueStat[] {
  const seen: TechniqueCounts = {};
  const caught: TechniqueCounts = {};
  for (const e of events) {
    for (const [k, v] of Object.entries(e.techniqueSeen)) {
      seen[k as RedFlagType] = (seen[k as RedFlagType] ?? 0) + (v ?? 0);
    }
    for (const [k, v] of Object.entries(e.techniqueCaught)) {
      caught[k as RedFlagType] = (caught[k as RedFlagType] ?? 0) + (v ?? 0);
    }
  }
  return (Object.keys(seen) as RedFlagType[])
    .map((t) => {
      const s = seen[t] ?? 0;
      const c = caught[t] ?? 0;
      return { technique: t, seen: s, caught: c, missRate: s ? 1 - c / s : 0 };
    })
    .sort((a, b) => b.missRate - a.missRate);
}

export type OrgOverview = {
  activeUsers: number;
  totalRounds: number;
  avgAccuracy: number;
  participationByDay: { date: string; rounds: number }[];
};

export function orgOverview(events: RoundEvent[]): OrgOverview {
  const users = new Set(events.map((e) => e.userId));
  let answered = 0;
  let correct = 0;
  const byDay = new Map<string, number>();
  for (const e of events) {
    answered += e.total;
    correct += e.correct;
    const day = e.at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const participationByDay = [...byDay.entries()]
    .map(([date, rounds]) => ({ date, rounds }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-14);

  return {
    activeUsers: users.size,
    totalRounds: events.length,
    avgAccuracy: answered ? correct / answered : 0,
    participationByDay,
  };
}
