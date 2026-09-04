import { NextResponse } from "next/server";
import type { Org, TechniqueCounts, User, UserStats } from "./types";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string) {
  return json({ error: message }, 400);
}
export function unauthorized() {
  return json({ error: "Not signed in" }, 401);
}
export function forbidden() {
  return json({ error: "Forbidden" }, 403);
}
export function notFound() {
  return json({ error: "Not found" }, 404);
}
export function tooManyRequests(retryAfterSec: number, message = "Too many requests. Please slow down.") {
  return NextResponse.json({ error: message }, { status: 429, headers: { "Retry-After": String(retryAfterSec) } });
}

/** Element-wise max merge of technique maps (monotonic, never double-counts). */
export function maxMergeCounts(a: TechniqueCounts, b: TechniqueCounts): TechniqueCounts {
  const out: TechniqueCounts = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const key = k as keyof TechniqueCounts;
    out[key] = Math.max(out[key] ?? 0, v ?? 0);
  }
  return out;
}

export function emptyStats(userId: string): UserStats {
  return {
    userId,
    xp: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    falsePositives: 0,
    falseNegatives: 0,
    bestStreak: 0,
    techniqueSeen: {},
    techniqueCaught: {},
    lastActive: new Date().toISOString(),
  };
}

/** Resolve how a user appears on a leaderboard, honouring org privacy settings. */
export function displayName(user: User | null, org: Org | null): string {
  if (!user) return "Player";
  const mode = org?.settings.leaderboardDisplay ?? "handle";
  if (mode === "anonymous") return `Player ${user.id.slice(-4).toUpperCase()}`;
  return user.handle || (user.email ? user.email.split("@")[0] : "Player");
}
