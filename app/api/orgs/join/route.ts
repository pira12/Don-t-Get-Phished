import { badRequest, json, notFound, unauthorized } from "@/server/http";
import { currentUser } from "@/server/auth";
import { db } from "@/server/db";
import { newId } from "@/server/ids";
import type { Membership } from "@/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Join an org with its shareable code — anyone with the code joins that org's
 * private leaderboard and shows up in its admin view. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  let body: { code?: string; team?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }
  const code = (body.code || "").trim();
  if (!code) return badRequest("Enter a join code");

  const org = await db.getOrgByJoinCode(code);
  if (!org) return notFound();

  const existing = await db.getMembership(user.id, org.id);
  if (existing) return json({ org, membership: existing });

  const membership: Membership = {
    userId: user.id,
    orgId: org.id,
    role: "player",
    team: (body.team || "").trim().slice(0, 40) || null,
    joinedAt: new Date().toISOString(),
  };
  await db.addMembership(membership);
  await db.addAudit({
    id: newId("aud"),
    orgId: org.id,
    actorId: user.id,
    action: "org.join",
    detail: `${user.handle} joined`,
    at: new Date().toISOString(),
  });

  return json({ org, membership });
}
