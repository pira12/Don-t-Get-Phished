import { badRequest, json } from "@/server/http";
import { requireOrgAdmin } from "@/server/guard";
import { db } from "@/server/db";
import { newId } from "@/server/ids";
import { assignmentAppliesTo, computeAssignmentProgress } from "@/server/assignments";
import { TECHNIQUE_LABELS, type RedFlagType } from "@/game/types";
import type { Assignment, AssignmentDifficulty } from "@/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIFFS = new Set(["easy", "medium", "hard", "mixed"]);

/** GET — list assignments with org-wide completion stats (admin). */
export async function GET(req: Request) {
  const orgId = new URL(req.url).searchParams.get("orgId");
  const guard = await requireOrgAdmin(orgId);
  if (!guard.ok) return guard.response;

  const assignments = await db.listAssignments(guard.org.id);
  const memberships = await db.listMemberships({ orgId: guard.org.id });
  const events = await db.listRoundEvents({ orgId: guard.org.id });
  const eventsByUser = new Map<string, typeof events>();
  for (const e of events) {
    const arr = eventsByUser.get(e.userId) ?? [];
    arr.push(e);
    eventsByUser.set(e.userId, arr);
  }

  const withStats = assignments.map((a) => {
    const targets = memberships.filter((m) => assignmentAppliesTo(a, m.team));
    let completed = 0;
    for (const m of targets) {
      const prog = computeAssignmentProgress(a, eventsByUser.get(m.userId) ?? []);
      if (prog.complete) completed += 1;
    }
    return { ...a, assignedCount: targets.length, completedCount: completed };
  });

  return json({ assignments: withStats });
}

/** POST — create an assignment. */
export async function POST(req: Request) {
  let body: Partial<Assignment> & { orgId?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }
  const guard = await requireOrgAdmin(body.orgId ?? null);
  if (!guard.ok) return guard.response;

  const title = String(body.title || "").slice(0, 120).trim();
  if (!title) return badRequest("Assignment needs a title");
  const difficulty = (DIFFS.has(String(body.difficulty)) ? body.difficulty : "mixed") as AssignmentDifficulty;
  const focusTechnique =
    body.focusTechnique && body.focusTechnique in TECHNIQUE_LABELS ? (body.focusTechnique as RedFlagType) : null;

  const assignment: Assignment = {
    id: newId("asg"),
    orgId: guard.org.id,
    createdBy: guard.user.id,
    title,
    difficulty,
    focusTechnique,
    minAccuracy: clamp01(Number(body.minAccuracy)),
    minRounds: Math.max(1, Math.min(20, Math.round(Number(body.minRounds) || 1))),
    team: String(body.team || "").slice(0, 40).trim() || null,
    dueDate: body.dueDate ? new Date(body.dueDate).toISOString() : null,
    createdAt: new Date().toISOString(),
  };
  await db.createAssignment(assignment);
  await db.addAudit({
    id: newId("aud"),
    orgId: guard.org.id,
    actorId: guard.user.id,
    action: "assignment.create",
    detail: `Assigned "${title}"${assignment.team ? ` to team ${assignment.team}` : ""}`,
    at: assignment.createdAt,
  });
  return json({ assignment });
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.7;
  return Math.max(0, Math.min(1, n));
}
