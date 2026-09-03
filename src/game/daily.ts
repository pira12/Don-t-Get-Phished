/**
 * The daily challenge: a curated set of emails that is the SAME for everyone on
 * a given date, derived deterministically from the calendar day. Pure.
 */

import type { GameEmail } from "./types";
import { buildRound } from "./rounds";
import { mulberry32, dateSeed } from "./rng";

export const DAILY_SIZE = 8;

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Deterministic daily deck. No `avoidIds` and a date-seeded RNG, so two players
 * opening the app on the same day get an identical sequence in an identical order.
 */
export function buildDailyDeck(pool: GameEmail[], dateKey = todayKey()): GameEmail[] {
  const rng = mulberry32(dateSeed(dateKey));
  return buildRound(pool, { size: DAILY_SIZE, difficulty: "mixed", rng });
}

export type DailyResult = {
  dateKey: string;
  correct: number;
  total: number;
  points: number;
  completedAt: string;
};
