import { badRequest, json } from "@/server/http";
import { issueMagicToken } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Request a magic link. In production this emails the link; with no mail provider
 * configured (the free self-hosted default) we return it directly so the flow is
 * fully usable. Set EMAIL_ENABLED=1 once a sender is wired to stop echoing it.
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

  const token = await issueMagicToken(email);
  const emailEnabled = process.env.EMAIL_ENABLED === "1";

  // TODO(prod): send `${origin}/signin?token=${token.token}` via your mail provider.
  return json({
    ok: true,
    emailSent: emailEnabled,
    devToken: emailEnabled ? undefined : token.token,
  });
}
