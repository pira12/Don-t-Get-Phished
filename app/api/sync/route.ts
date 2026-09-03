import { badRequest, emptyStats, json, maxMergeCounts, unauthorized } from "@/server/http";
import { currentUser } from "@/server/auth";
import { db } from "@/server/db";
import type { UserStats } from "@/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Return the signed-in user's server stat mirror. */
export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const stats = (await db.getStats(user.id)) ?? emptyStats(user.id);
  return json({ stats });
}

/**
 * Merge the client's cumulative stats into the server mirror. Offline-first: the
 * client is authoritative, so we element-wise MAX every monotonic counter — this
 * adopts guest progress on sign-in and reconciles multiple devices without ever
 * double-counting.
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  let incoming: Partial<UserStats>;
  try {
    incoming = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const cur = (await db.getStats(user.id)) ?? emptyStats(user.id);
  const merged: UserStats = {
    userId: user.id,
    xp: Math.max(cur.xp, incoming.xp ?? 0),
    totalAnswered: Math.max(cur.totalAnswered, incoming.totalAnswered ?? 0),
    totalCorrect: Math.max(cur.totalCorrect, incoming.totalCorrect ?? 0),
    falsePositives: Math.max(cur.falsePositives, incoming.falsePositives ?? 0),
    falseNegatives: Math.max(cur.falseNegatives, incoming.falseNegatives ?? 0),
    bestStreak: Math.max(cur.bestStreak, incoming.bestStreak ?? 0),
    techniqueSeen: maxMergeCounts(cur.techniqueSeen, incoming.techniqueSeen ?? {}),
    techniqueCaught: maxMergeCounts(cur.techniqueCaught, incoming.techniqueCaught ?? {}),
    lastActive: new Date().toISOString(),
  };
  await db.putStats(merged);
  return json({ stats: merged });
}
