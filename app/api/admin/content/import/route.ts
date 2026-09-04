import { badRequest, json } from "@/server/http";
import { requireOrgAdmin } from "@/server/guard";
import { buildDraftFromRaw } from "@/server/importEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/content/import { orgId, raw }
 * Parses + DEFANGS a pasted real email into a safe, unsaved draft for the admin to
 * review, tag and (optionally) publish. Nothing is persisted here — a human always
 * reviews imported content before it goes live.
 */
export async function POST(req: Request) {
  let body: { orgId?: string; raw?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }
  const guard = await requireOrgAdmin(body.orgId ?? null);
  if (!guard.ok) return guard.response;

  const raw = String(body.raw || "");
  if (raw.trim().length < 10) return badRequest("Paste a full email (headers and/or body).");
  if (raw.length > 100_000) return badRequest("That email is too large to import.");

  const draft = buildDraftFromRaw(raw);
  return json({ draft });
}
