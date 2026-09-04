import { badRequest, json } from "@/server/http";
import { requestSignIn } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Step 1 of sign-in. In production (Supabase) this emails a one-time code. In
 * local dev / CI (no Supabase configured) it returns the code directly so the flow
 * is usable without a mail provider.
 */
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }
  const email = (body.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return badRequest("Enter a valid email");

  const origin = new URL(req.url).origin;
  try {
    const result = await requestSignIn(email, origin);
    return json({ ok: true, emailSent: result.emailSent, devToken: result.devToken });
  } catch (e) {
    return json({ error: (e as Error).message || "Could not send sign-in email." }, 502);
  }
}
