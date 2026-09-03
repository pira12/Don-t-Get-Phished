import { json } from "@/server/http";
import { currentUser } from "@/server/auth";
import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Current user + their org memberships (or { user: null } for a guest). */
export async function GET() {
  const user = await currentUser();
  if (!user) return json({ user: null, memberships: [] });
  const memberships = await db.listMemberships({ userId: user.id });
  const orgs = await Promise.all(
    memberships.map(async (m) => ({
      membership: m,
      org: await db.getOrg(m.orgId),
    })),
  );
  return json({ user, memberships: orgs.filter((o) => o.org) });
}
