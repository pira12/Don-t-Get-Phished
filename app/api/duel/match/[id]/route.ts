import { json, notFound, unauthorized } from "@/server/http";
import { currentUser } from "@/server/auth";
import { duelHub } from "@/server/duelHub";
import { finalizeMatchRatings } from "@/server/duelFinalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/duel/match/:id — the current player's live view of the match. Polled
 * for opponent progress; also drives the one-time Elo finalisation on finish. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const match = duelHub.get(params.id);
  if (!match || !match.players[user.id]) return notFound();

  if (match.status === "finished") await finalizeMatchRatings(match);
  return json(duelHub.view(match, user.id));
}
