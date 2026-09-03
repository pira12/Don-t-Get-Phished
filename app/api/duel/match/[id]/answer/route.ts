import { badRequest, json, unauthorized } from "@/server/http";
import { currentUser } from "@/server/auth";
import { duelHub } from "@/server/duelHub";
import { finalizeMatchRatings } from "@/server/duelFinalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/duel/match/:id/answer { correct, elapsedMs } — record a classification. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return unauthorized();

  let body: { correct?: boolean; elapsedMs?: number };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }
  const elapsedMs = Math.max(0, Math.min(600000, Math.round(Number(body.elapsedMs) || 0)));
  const result = duelHub.answer(params.id, user.id, !!body.correct, elapsedMs);
  if ("error" in result) return json(result, 400);

  const match = duelHub.get(params.id);
  if (match && match.status === "finished") await finalizeMatchRatings(match);

  return json(match ? duelHub.view(match, user.id) : result);
}
