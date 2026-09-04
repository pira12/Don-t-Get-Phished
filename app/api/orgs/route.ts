import { badRequest, json, unauthorized } from "@/server/http";
import { currentUser } from "@/server/auth";
import { db } from "@/server/db";
import { newId, newJoinCode } from "@/server/ids";
import type { Membership, Org } from "@/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Create an org — no IT project needed. The creator becomes its org_admin and
 * gets a shareable join code. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }
  const name = (body.name || "").trim().slice(0, 60);
  if (name.length < 2) return badRequest("Give your organization a name");

  // Ensure a unique join code.
  let joinCode = newJoinCode();
  for (let i = 0; i < 5 && (await db.getOrgByJoinCode(joinCode)); i++) joinCode = newJoinCode();

  const org: Org = {
    id: newId("org"),
    name,
    joinCode,
    createdAt: new Date().toISOString(),
    settings: { leaderboardDisplay: "handle", competitiveEnabled: true },
    plan: "free",
  };
  await db.createOrg(org);

  const membership: Membership = {
    userId: user.id,
    orgId: org.id,
    role: "org_admin",
    team: null,
    joinedAt: new Date().toISOString(),
  };
  await db.addMembership(membership);
  await db.addAudit({
    id: newId("aud"),
    orgId: org.id,
    actorId: user.id,
    action: "org.create",
    detail: `Created org "${name}"`,
    at: new Date().toISOString(),
  });

  return json({ org, membership });
}
