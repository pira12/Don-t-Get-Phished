import { json, notFound } from "@/server/http";
import { requireOrgAdmin } from "@/server/guard";
import { db } from "@/server/db";
import { newId } from "@/server/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** DELETE /api/admin/assignments/:id */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const existing = await db.getAssignment(params.id);
  if (!existing) return notFound();
  const guard = await requireOrgAdmin(existing.orgId);
  if (!guard.ok) return guard.response;

  await db.deleteAssignment(params.id);
  await db.addAudit({
    id: newId("aud"),
    orgId: existing.orgId,
    actorId: guard.user.id,
    action: "assignment.delete",
    detail: `Removed assignment "${existing.title}"`,
    at: new Date().toISOString(),
  });
  return json({ ok: true });
}
