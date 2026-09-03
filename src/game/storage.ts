/**
 * Local-first persistence for the guest player. Everything a player earns is
 * stored in localStorage so the very first email needs no account. A future
 * backend can hydrate/sync this same shape for signed-in players.
 */

import type { RedFlagType } from "./types";

export type LifetimeStats = {
  handle: string;
  totalAnswered: number;
  totalCorrect: number;
  falsePositives: number; // flagged a legit email
  falseNegatives: number; // missed a phishing email
  bestStreak: number;
  xp: number;
  roundsPlayed: number;
  /** Per-technique: attempts + catches, for the weakness heatmap. */
  techniqueSeen: Partial<Record<RedFlagType, number>>;
  techniqueCaught: Partial<Record<RedFlagType, number>>;
  fastestReplyToCatchMs: number;
  cleanRunNoFalsePositive: number;
  perfectHeaderRounds: number;
  dailyStreak: number;
  lastPlayedDate: string | null;
  answeredIds: string[]; // to reduce repetition across rounds
};

export const EMPTY_STATS: LifetimeStats = {
  handle: "",
  totalAnswered: 0,
  totalCorrect: 0,
  falsePositives: 0,
  falseNegatives: 0,
  bestStreak: 0,
  xp: 0,
  roundsPlayed: 0,
  techniqueSeen: {},
  techniqueCaught: {},
  fastestReplyToCatchMs: Infinity,
  cleanRunNoFalsePositive: 0,
  perfectHeaderRounds: 0,
  dailyStreak: 0,
  lastPlayedDate: null,
  answeredIds: [],
};

const KEY = "izd.stats.v1";

export function loadStats(): LifetimeStats {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_STATS };
    const parsed = JSON.parse(raw) as Partial<LifetimeStats>;
    // fastestReplyToCatchMs serialises Infinity as null — restore it.
    const fastest =
      typeof parsed.fastestReplyToCatchMs === "number" ? parsed.fastestReplyToCatchMs : Infinity;
    return { ...EMPTY_STATS, ...parsed, fastestReplyToCatchMs: fastest };
  } catch {
    return { ...EMPTY_STATS };
  }
}

export function saveStats(stats: LifetimeStats): void {
  try {
    const serialisable = {
      ...stats,
      fastestReplyToCatchMs: Number.isFinite(stats.fastestReplyToCatchMs)
        ? stats.fastestReplyToCatchMs
        : null,
    };
    window.localStorage.setItem(KEY, JSON.stringify(serialisable));
  } catch {
    /* storage unavailable — play continues in-memory only */
  }
}

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Advance the daily streak: +1 if yesterday, reset to 1 if a gap, unchanged if same day. */
export function updateDailyStreak(stats: LifetimeStats, today = todayKey()): LifetimeStats {
  if (stats.lastPlayedDate === today) return stats;
  let dailyStreak = 1;
  if (stats.lastPlayedDate) {
    const prev = new Date(stats.lastPlayedDate);
    const now = new Date(today);
    const diffDays = Math.round((now.getTime() - prev.getTime()) / 86_400_000);
    dailyStreak = diffDays === 1 ? stats.dailyStreak + 1 : 1;
  }
  return { ...stats, dailyStreak, lastPlayedDate: today };
}
