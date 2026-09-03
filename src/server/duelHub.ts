/**
 * Authoritative live-match manager for real-time 1v1 duels (human vs human).
 *
 * This is an in-memory singleton — correct and simple for the free single-node
 * deployment. Pairing runs synchronously (JS is single-threaded, so the critical
 * section has no interleaving await) which makes matchmaking atomic without a lock.
 * For a multi-node deployment this state moves to Redis (Phase 2b); the API surface
 * stays the same. The bot opponent is the CLIENT-side fallback when no human is
 * waiting, so the hub only ever holds human matches.
 */

import { duelPointsFor, duelOutcome, type DuelConfig } from "@/game/duel";
import { hashString } from "@/game/rng";
import { newId } from "./ids";

export type MatchStatus = "waiting" | "active" | "finished";

type Move = { correct: boolean; elapsedMs: number; points: number };

type Player = {
  userId: string;
  name: string;
  rating: number;
  index: number;
  score: number;
  moves: Move[];
  finished: boolean;
  lastSeen: number;
};

export type Match = {
  id: string;
  seed: number;
  size: number;
  difficulty: DuelConfig["difficulty"];
  order: string[]; // [player1Id, player2Id?]
  players: Record<string, Player>;
  status: MatchStatus;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  winnerId?: string | null; // null = draw
  rated: boolean; // Elo already applied?
  results?: Record<string, { before: number; after: number; delta: number }>;
};

export type MatchView = {
  matchId: string;
  status: MatchStatus;
  seed: number;
  size: number;
  difficulty: DuelConfig["difficulty"];
  you: { score: number; index: number; finished: boolean };
  opponent: { name: string; score: number; index: number; finished: boolean } | null;
  bothFinished: boolean;
  winnerId?: string | null;
  youWon?: boolean | null; // true/false, null = draw; undefined while unfinished
  ratingAfter?: number;
  ratingDelta?: number;
};

const WAITING_TTL_MS = 45_000; // stop offering a waiting match after this
const FINISHED_TTL_MS = 10 * 60_000;
const FORFEIT_GRACE_MS = 20_000;

class DuelHub {
  private matches = new Map<string, Match>();

  private prune() {
    const now = Date.now();
    for (const [id, m] of this.matches) {
      if (m.status === "finished" && m.finishedAt && now - m.finishedAt > FINISHED_TTL_MS) {
        this.matches.delete(id);
      } else if (m.status === "waiting" && now - m.createdAt > WAITING_TTL_MS * 3) {
        this.matches.delete(id);
      }
    }
  }

  /** Atomic (synchronous) join-or-create. */
  matchmake(
    user: { id: string; name: string; rating: number },
    settings: { size: number; difficulty: DuelConfig["difficulty"] },
  ): { matchId: string; role: 1 | 2; status: MatchStatus } {
    this.prune();
    const now = Date.now();

    // Already waiting? return the same match (idempotent).
    for (const m of this.matches.values()) {
      if (m.status === "waiting" && m.order[0] === user.id) {
        return { matchId: m.id, role: 1, status: m.status };
      }
    }

    // Find the oldest compatible waiting match from a different user.
    let best: Match | null = null;
    for (const m of this.matches.values()) {
      if (
        m.status === "waiting" &&
        m.order[0] !== user.id &&
        m.size === settings.size &&
        m.difficulty === settings.difficulty &&
        now - m.createdAt <= WAITING_TTL_MS
      ) {
        if (!best || m.createdAt < best.createdAt) best = m;
      }
    }

    if (best) {
      best.players[user.id] = this.blankPlayer(user, now);
      best.order.push(user.id);
      best.status = "active";
      best.startedAt = now;
      return { matchId: best.id, role: 2, status: "active" };
    }

    // Create a fresh waiting match. Seed is deterministic-ish but unique.
    const seed = hashString(`${user.id}:${now}:${Math.random()}`);
    const match: Match = {
      id: newId("mch"),
      seed,
      size: settings.size,
      difficulty: settings.difficulty,
      order: [user.id],
      players: { [user.id]: this.blankPlayer(user, now) },
      status: "waiting",
      createdAt: now,
      rated: false,
    };
    this.matches.set(match.id, match);
    return { matchId: match.id, role: 1, status: "waiting" };
  }

  private blankPlayer(user: { id: string; name: string; rating: number }, now: number): Player {
    return { userId: user.id, name: user.name, rating: user.rating, index: 0, score: 0, moves: [], finished: false, lastSeen: now };
  }

  get(matchId: string): Match | undefined {
    return this.matches.get(matchId);
  }

  /** Record a player's classification of one email. */
  answer(matchId: string, userId: string, correct: boolean, elapsedMs: number): MatchView | { error: string } {
    const m = this.matches.get(matchId);
    if (!m) return { error: "Match not found" };
    const p = m.players[userId];
    if (!p) return { error: "Not in this match" };
    if (m.status !== "active") return { error: "Match not active" };
    if (p.finished || p.index >= m.size) return this.view(m, userId);

    p.lastSeen = Date.now();
    const points = duelPointsFor(correct, elapsedMs);
    p.moves.push({ correct, elapsedMs, points });
    p.score += points;
    p.index += 1;
    if (p.index >= m.size) p.finished = true;

    this.maybeFinish(m);
    return this.view(m, userId);
  }

  /** A present player claims a win when the opponent has gone silent past grace. */
  claimForfeit(matchId: string, userId: string): MatchView | { error: string } {
    const m = this.matches.get(matchId);
    if (!m) return { error: "Match not found" };
    if (m.status !== "active") return this.view(m, userId);
    const opp = m.order.find((id) => id !== userId);
    if (!opp) return { error: "No opponent" };
    const oppP = m.players[opp];
    if (Date.now() - oppP.lastSeen < FORFEIT_GRACE_MS) return { error: "Opponent still connected" };
    m.status = "finished";
    m.finishedAt = Date.now();
    m.winnerId = userId;
    return this.view(m, userId);
  }

  cancelWaiting(matchId: string, userId: string): void {
    const m = this.matches.get(matchId);
    if (m && m.status === "waiting" && m.order[0] === userId) this.matches.delete(matchId);
  }

  /** Claim the rating-application slot exactly once (returns false if already taken). */
  claimRating(matchId: string): boolean {
    const m = this.matches.get(matchId);
    if (!m || m.status !== "finished" || m.rated) return false;
    m.rated = true;
    return true;
  }

  setResults(matchId: string, results: Record<string, { before: number; after: number; delta: number }>): void {
    const m = this.matches.get(matchId);
    if (m) m.results = results;
  }

  private maybeFinish(m: Match) {
    if (m.order.length < 2) return;
    const [a, b] = m.order.map((id) => m.players[id]);
    if (a.finished && b.finished) {
      m.status = "finished";
      m.finishedAt = Date.now();
      const out = duelOutcome(a.score, b.score); // from a's perspective
      m.winnerId = out === "win" ? a.userId : out === "loss" ? b.userId : null;
    }
  }

  /** Build the per-viewer state, touching lastSeen. */
  view(m: Match, userId: string): MatchView {
    const you = m.players[userId];
    if (you) you.lastSeen = Date.now();
    const oppId = m.order.find((id) => id !== userId);
    const opp = oppId ? m.players[oppId] : undefined;

    const base: MatchView = {
      matchId: m.id,
      status: m.status,
      seed: m.seed,
      size: m.size,
      difficulty: m.difficulty,
      you: { score: you?.score ?? 0, index: you?.index ?? 0, finished: you?.finished ?? false },
      opponent: opp ? { name: opp.name, score: opp.score, index: opp.index, finished: opp.finished } : null,
      bothFinished: m.status === "finished",
    };
    if (m.status === "finished") {
      base.winnerId = m.winnerId ?? null;
      base.youWon = m.winnerId == null ? null : m.winnerId === userId;
      const r = m.results?.[userId];
      if (r) {
        base.ratingAfter = r.after;
        base.ratingDelta = r.delta;
      }
    }
    return base;
  }
}

/** One instance across dev hot-reloads / requests. */
const g = globalThis as unknown as { __izdDuelHub?: DuelHub };
export const duelHub: DuelHub = g.__izdDuelHub ?? (g.__izdDuelHub = new DuelHub());
