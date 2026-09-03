import { badRequest, json, unauthorized } from "@/server/http";
import { currentUser } from "@/server/auth";
import { db } from "@/server/db";
import { newId } from "@/server/ids";
import type { RoundEvent, RoundSubmission } from "@/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Record a finished round as an append-only event. This feeds the time-boxed
 * (weekly/seasonal) leaderboards and the org weakness heatmap. `orgId` scopes the
 * event to an org the user belongs to (or null for the global pool).
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  let body: RoundSubmission & { orgId?: string | null };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  // Only accept an orgId the user is actually a member of.
  let orgId: string | null = null;
  if (body.orgId) {
    const membership = await db.getMembership(user.id, body.orgId);
    if (membership) orgId = body.orgId;
  }

  const total = clampInt(body.total, 0, 100);
  const correct = clampInt(body.correct, 0, total);

  const event: RoundEvent = {
    id: newId("evt"),
    userId: user.id,
    orgId,
    at: new Date().toISOString(),
    difficulty: String(body.difficulty || "mixed").slice(0, 12),
    total,
    correct,
    points: clampInt(body.points, 0, 100000),
    falsePositives: clampInt(body.falsePositives, 0, total),
    falseNegatives: clampInt(body.falseNegatives, 0, total),
    techniqueSeen: body.techniqueSeen ?? {},
    techniqueCaught: body.techniqueCaught ?? {},
  };
  await db.addRoundEvent(event);
  return json({ ok: true });
}

function clampInt(n: unknown, lo: number, hi: number): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, v));
}
