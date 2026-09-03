import { badRequest, json } from "@/server/http";
import { requireOrgAdmin } from "@/server/guard";
import { db } from "@/server/db";
import { newId } from "@/server/ids";
import { validateEmailInput, type ContentInput } from "@/server/content";
import type { ServerEmail } from "@/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/content?orgId= — list an org's authored emails (admin). */
export async function GET(req: Request) {
  const orgId = new URL(req.url).searchParams.get("orgId");
  const guard = await requireOrgAdmin(orgId);
  if (!guard.ok) return guard.response;
  const emails = await db.listEmails({ orgId: guard.org.id });
  return json({ emails });
}

/** POST /api/admin/content — create a new scenario email (draft, unpublished). */
export async function POST(req: Request) {
  let body: ContentInput & { orgId?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }
  const guard = await requireOrgAdmin(body.orgId ?? null);
  if (!guard.ok) return guard.response;

  const result = validateEmailInput(body);
  if (!result.ok) return json({ errors: result.errors }, 422);

  const now = new Date().toISOString();
  const email: ServerEmail = {
    ...result.email,
    id: newId("eml"),
    orgId: guard.org.id,
    authorId: guard.user.id,
    version: 1,
    published: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.createEmail(email);
  await db.addAudit({
    id: newId("aud"),
    orgId: guard.org.id,
    actorId: guard.user.id,
    action: "content.create",
    detail: `Created scenario "${email.subject}"`,
    at: now,
  });
  return json({ email });
}
