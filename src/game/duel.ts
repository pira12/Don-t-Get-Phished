/**
 * Offline / async duels (Phase 1). A duel is fully described by a compact,
 * shareable CHALLENGE CODE that encodes a seed + settings. Both players build the
 * exact same email sequence from that seed and compare results locally. A tunable
 * bot provides an always-available opponent.
 *
 * Everything here is pure and framework-free. In Phase 2 the same seed/deck/score
 * functions drive authoritative server-side scoring for real-time matchmaking —
 * only the transport (who you race) changes, not the game.
 */

import type { Difficulty, GameEmail, Verdict } from "./types";
import { buildRound } from "./rounds";
import { mulberry32, hashString } from "./rng";

export type DuelConfig = {
  seed: number;
  size: number;
  difficulty: Difficulty | "mixed";
};

export type BotSkill = "rookie" | "analyst" | "threat_hunter";

export const BOT_PROFILES: Record<
  BotSkill,
  { label: string; accuracy: number; baseMs: number; jitterMs: number }
> = {
  // accuracy = base probability of a correct call (modulated by difficulty)
  rookie: { label: "Rookie bot", accuracy: 0.62, baseMs: 9000, jitterMs: 6000 },
  analyst: { label: "Analyst bot", accuracy: 0.8, baseMs: 6000, jitterMs: 4000 },
  threat_hunter: { label: "Threat Hunter bot", accuracy: 0.92, baseMs: 4200, jitterMs: 3000 },
};

/** Points model for a duel email: correctness first, speed as the tiebreaker,
 * and a wrong call costs more than a slow-but-right one (never reward guessing). */
export const DUEL_WRONG_PENALTY = -40;
export const DUEL_CORRECT_BASE = 100;

export function duelSpeedBonus(elapsedMs: number): number {
  const s = elapsedMs / 1000;
  if (s <= 3) return 50;
  if (s <= 6) return 35;
  if (s <= 10) return 20;
  if (s <= 15) return 10;
  return 0;
}

export function duelPointsFor(correct: boolean, elapsedMs: number): number {
  if (!correct) return DUEL_WRONG_PENALTY;
  return DUEL_CORRECT_BASE + duelSpeedBonus(elapsedMs);
}

// ---------------------------------------------------------------------------
// Challenge code (URL-safe, compact)
// ---------------------------------------------------------------------------

const DIFF_CODE: Record<Difficulty | "mixed", string> = {
  easy: "e",
  medium: "m",
  hard: "h",
  mixed: "x",
};
const CODE_DIFF: Record<string, Difficulty | "mixed"> = { e: "easy", m: "medium", h: "hard", x: "mixed" };

/** Encode a duel as `v1-<seed36>-<size>-<diff>` — short, shareable, versioned. */
export function encodeChallenge(cfg: DuelConfig): string {
  const seed = (cfg.seed >>> 0).toString(36);
  return `v1-${seed}-${cfg.size}-${DIFF_CODE[cfg.difficulty]}`;
}

export function decodeChallenge(code: string): DuelConfig | null {
  const m = /^v1-([0-9a-z]+)-(\d{1,2})-([emhx])$/.exec(code.trim().toLowerCase());
  if (!m) return null;
  const seed = parseInt(m[1], 36) >>> 0;
  const size = Math.max(3, Math.min(15, parseInt(m[2], 10)));
  const difficulty = CODE_DIFF[m[3]];
  if (!difficulty || Number.isNaN(seed)) return null;
  return { seed, size, difficulty };
}

/** Make a fresh random challenge (optionally salted by a handle for uniqueness). */
export function newChallenge(
  size = 7,
  difficulty: Difficulty | "mixed" = "mixed",
  salt = "",
): DuelConfig {
  const seed = hashString(`${Date.now()}:${Math.random()}:${salt}`);
  return { seed, size, difficulty };
}

// ---------------------------------------------------------------------------
// Deterministic deck + bot
// ---------------------------------------------------------------------------

/** Build the exact email sequence for a duel from its seed — identical for both
 * players who open the same challenge link. */
export function buildDuelDeck(pool: GameEmail[], cfg: DuelConfig): GameEmail[] {
  const rng = mulberry32(cfg.seed);
  return buildRound(pool, { size: cfg.size, difficulty: cfg.difficulty, rng });
}

export type BotMove = { verdict: Verdict; correct: boolean; elapsedMs: number; points: number };

/**
 * Precompute the bot's play over a deck, deterministically seeded from the duel
 * seed + bot skill so a given challenge always yields the same opponent run.
 */
export function simulateBot(deck: GameEmail[], skill: BotSkill, seed: number): BotMove[] {
  const profile = BOT_PROFILES[skill];
  const rng = mulberry32((seed ^ hashString(skill)) >>> 0);
  return deck.map((email) => {
    // Harder emails are harder for the bot too.
    const diffPenalty = email.difficulty === "hard" ? 0.16 : email.difficulty === "medium" ? 0.07 : 0;
    const pCorrect = Math.max(0.05, Math.min(0.99, profile.accuracy - diffPenalty));
    const correct = rng() < pCorrect;
    const verdict: Verdict = correct
      ? email.truth
      : email.truth === "phishing"
        ? "legit"
        : "phishing";
    const elapsedMs = Math.round(profile.baseMs + rng() * profile.jitterMs);
    return { verdict, correct, elapsedMs, points: duelPointsFor(correct, elapsedMs) };
  });
}

export type DuelOutcome = "win" | "loss" | "draw";

export function duelOutcome(playerScore: number, botScore: number): DuelOutcome {
  if (playerScore > botScore) return "win";
  if (playerScore < botScore) return "loss";
  return "draw";
}

/** Simple, transparent rating delta for offline bot duels (local rating). */
export function ratingDelta(outcome: DuelOutcome): number {
  return outcome === "win" ? 25 : outcome === "draw" ? 0 : -18;
}

/** Elo expected score for a player rated `myR` against `oppR`. */
export function eloExpected(myR: number, oppR: number): number {
  return 1 / (1 + Math.pow(10, (oppR - myR) / 400));
}

/** Elo rating delta for online duels. score = 1 win / 0.5 draw / 0 loss. */
export function eloDelta(myR: number, oppR: number, score: number, k = 24): number {
  return Math.round(k * (score - eloExpected(myR, oppR)));
}

export function scoreForOutcome(outcome: DuelOutcome): number {
  return outcome === "win" ? 1 : outcome === "draw" ? 0.5 : 0;
}
