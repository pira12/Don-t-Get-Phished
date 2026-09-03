import { json } from "@/server/http";
import { requireMember } from "@/server/guard";
import { db } from "@/server/db";
import { assignmentAppliesTo, computeAssignmentProgress } from "@/server/assignments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/assignments?orgId= — the current member's applicable training
 * assignments with their personal progress. Powers the player "My training" view.
 */
export async function GET(req: Request) {
  const orgId = new URL(req.url).searchParams.get("orgId");
  const guard = await requireMember(orgId);
  if (!guard.ok) return guard.response;

  const membership = await db.getMembership(guard.user.id, guard.org.id);
  const team = membership?.team ?? null;

  const assignments = await db.listAssignments(guard.org.id);
  const events = (await db.listRoundEvents({ orgId: guard.org.id })).filter((e) => e.userId === guard.user.id);

  const mine = assignments
    .filter((a) => assignmentAppliesTo(a, team))
    .map((a) => ({ assignment: a, progress: computeAssignmentProgress(a, events) }));

  return json({ assignments: mine });
}
