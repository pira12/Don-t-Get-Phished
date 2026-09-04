import { json } from "@/server/http";
import { endSession } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await endSession();
  return json({ ok: true });
}
