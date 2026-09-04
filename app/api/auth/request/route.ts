import { badRequest, json, tooManyRequests } from "@/server/http";
import { requestSignIn } from "@/server/auth";
import { clientIp, rateLimit } from "@/server/rateLimit";

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

  // Sending sign-in emails is abuse-prone (spam / enumeration): cap per IP and
  // per target address.
  const ip = clientIp(req);
  const byIp = rateLimit(`auth:req:ip:${ip}`, 10, 60_000);
  if (!byIp.ok) return tooManyRequests(byIp.retryAfterSec);
  const byEmail = rateLimit(`auth:req:email:${email}`, 5, 15 * 60_000);
  if (!byEmail.ok) return tooManyRequests(byEmail.retryAfterSec);

  const origin = new URL(req.url).origin;
  try {
    const result = await requestSignIn(email, origin);
    return json({ ok: true, emailSent: result.emailSent, devToken: result.devToken });
  } catch (e) {
    return json({ error: (e as Error).message || "Could not send sign-in email." }, 502);
  }
}
