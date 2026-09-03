import { json } from "@/server/http";
import { clearSessionCookie } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  clearSessionCookie();
  return json({ ok: true });
}
