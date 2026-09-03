import { badRequest, json, unauthorized } from "@/server/http";
import { currentUser } from "@/server/auth";
import { duelHub } from "@/server/duelHub";
import { getRating } from "@/server/duelFinalize";
import type { DuelConfig } from "@/game/duel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIFFS = new Set(["easy", "medium", "hard", "mixed"]);

/** POST — join or create a live 1v1 match. Returns the match id + role + status. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  let body: { size?: number; difficulty?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }
  const size = Math.max(3, Math.min(12, Math.round(Number(body.size) || 7)));
  const difficulty = (DIFFS.has(String(body.difficulty)) ? body.difficulty : "mixed") as DuelConfig["difficulty"];

  const rating = await getRating(user.id);
  const res = duelHub.matchmake({ id: user.id, name: user.handle, rating: rating.rating }, { size, difficulty });
  const match = duelHub.get(res.matchId)!;

  return json({
    matchId: res.matchId,
    role: res.role,
    status: res.status,
    seed: match.seed,
    size: match.size,
    difficulty: match.difficulty,
    rating: rating.rating,
  });
}

/** DELETE — cancel a still-waiting match (leaving the queue). */
export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const matchId = new URL(req.url).searchParams.get("matchId");
  if (matchId) duelHub.cancelWaiting(matchId, user.id);
  return json({ ok: true });
}
