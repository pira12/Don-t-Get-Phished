import { badRequest, json, notFound } from "@/server/http";
import { requireOrgAdmin } from "@/server/guard";
import { db } from "@/server/db";
import { newId } from "@/server/ids";
import { validateEmailInput, type ContentInput } from "@/server/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

/** PUT /api/admin/content/:id — update an email (bumps version) and/or toggle
 * publish. Body may be a full email edit, or just `{ published: boolean }`. */
export async function PUT(req: Request, { params }: Ctx) {
  const existing = await db.getEmail(params.id);
  if (!existing) return notFound();
  const guard = await requireOrgAdmin(existing.orgId);
  if (!guard.ok) return guard.response;

  let body: (ContentInput & { published?: boolean }) | { published: boolean };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  // Publish-only toggle.
  if (Object.keys(body).length === 1 && "published" in body) {
    const updated = await db.updateEmail(params.id, {
      published: !!body.published,
      updatedAt: new Date().toISOString(),
    });
    await db.addAudit({
      id: newId("aud"),
      orgId: existing.orgId,
      actorId: guard.user.id,
      action: body.published ? "content.publish" : "content.unpublish",
      detail: `${body.published ? "Published" : "Unpublished"} "${existing.subject}"`,
      at: new Date().toISOString(),
    });
    return json({ email: updated });
  }

  const result = validateEmailInput(body as ContentInput);
  if (!result.ok) return json({ errors: result.errors }, 422);

  const updated = await db.updateEmail(params.id, {
    ...result.email,
    id: existing.id,
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  });
  return json({ email: updated });
}

/** DELETE /api/admin/content/:id */
export async function DELETE(_req: Request, { params }: Ctx) {
  const existing = await db.getEmail(params.id);
  if (!existing) return notFound();
  const guard = await requireOrgAdmin(existing.orgId);
  if (!guard.ok) return guard.response;

  await db.deleteEmail(params.id);
  await db.addAudit({
    id: newId("aud"),
    orgId: existing.orgId,
    actorId: guard.user.id,
    action: "content.delete",
    detail: `Deleted "${existing.subject}"`,
    at: new Date().toISOString(),
  });
  return json({ ok: true });
}
