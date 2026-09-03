import { json } from "@/server/http";
import { requireMember } from "@/server/guard";
import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/content?orgId= — published org scenario emails, for members to play
 * alongside the built-in global set. Members only (org content is private).
 */
export async function GET(req: Request) {
  const orgId = new URL(req.url).searchParams.get("orgId");
  const guard = await requireMember(orgId);
  if (!guard.ok) return guard.response;
  const emails = await db.listEmails({ orgId: guard.org.id, publishedOnly: true });
  // Return the plain GameEmail shape the client already understands.
  return json({ emails });
}
