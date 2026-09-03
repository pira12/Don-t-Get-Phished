/**
 * The data interface. ALL persistence goes through a GameStore so that Phase 2
 * only has to provide an API-backed implementation — no game code changes.
 *
 * Phase 1 ships `localStore` (browser localStorage, guest-first). A future
 * `apiStore` implementing the same interface swaps in for signed-in players and
 * cross-device sync; the UI and game logic never know the difference.
 */

import { loadStats as lsLoad, saveStats as lsSave, type LifetimeStats } from "./storage";
import type { DailyResult } from "./daily";

export type DuelState = {
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  /** last few results, newest first */
  history: DuelHistoryEntry[];
};

export type DuelHistoryEntry = {
  at: string;
  outcome: "win" | "loss" | "draw";
  playerScore: number;
  opponentScore: number;
  opponent: string;
  ratingAfter: number;
};

export const EMPTY_DUEL_STATE: DuelState = {
  rating: 1000,
  wins: 0,
  losses: 0,
  draws: 0,
  history: [],
};

export interface GameStore {
  loadStats(): LifetimeStats;
  saveStats(s: LifetimeStats): void;
  getDailyResult(dateKey: string): DailyResult | null;
  setDailyResult(r: DailyResult): void;
  loadDuelState(): DuelState;
  saveDuelState(s: DuelState): void;
}

const DAILY_KEY = "izd.daily.v1";
const DUEL_KEY = "izd.duel.v1";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...(JSON.parse(raw) as object) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

export const localStore: GameStore = {
  loadStats: lsLoad,
  saveStats: lsSave,

  getDailyResult(dateKey) {
    const all = readJSON<Record<string, DailyResult>>(DAILY_KEY, {});
    return all[dateKey] ?? null;
  },
  setDailyResult(r) {
    const all = readJSON<Record<string, DailyResult>>(DAILY_KEY, {});
    all[r.dateKey] = r;
    writeJSON(DAILY_KEY, all);
  },

  loadDuelState() {
    return readJSON<DuelState>(DUEL_KEY, EMPTY_DUEL_STATE);
  },
  saveDuelState(s) {
    writeJSON(DUEL_KEY, s);
  },
};

/** The active store. Phase 2: switch this to an api-backed store for signed-in users. */
export const store: GameStore = localStore;
