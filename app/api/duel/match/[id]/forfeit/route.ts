import { json, unauthorized } from "@/server/http";
import { currentUser } from "@/server/auth";
import { duelHub } from "@/server/duelHub";
import { finalizeMatchRatings } from "@/server/duelFinalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST — claim a win when the opponent has disconnected (past the grace period). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const result = duelHub.claimForfeit(params.id, user.id);
  if ("error" in result) return json(result, 400);
  const match = duelHub.get(params.id);
  if (match && match.status === "finished") await finalizeMatchRatings(match);
  return json(match ? duelHub.view(match, user.id) : result);
}
