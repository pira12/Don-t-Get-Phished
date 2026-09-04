import { badRequest, json } from "@/server/http";
import { verifySignIn } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Step 2 of sign-in. Verifies the code/token, creating the account on first
 * sign-in and reserving the handle. The session is established as a side effect.
 * `email` is required for the Supabase OTP flow; the dev flow ignores it. */
export async function POST(req: Request) {
  let body: { token?: string; handle?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }
  const token = (body.token || "").trim();
  if (!token) return badRequest("Missing code");
  const email = (body.email || "").trim().toLowerCase() || undefined;

  try {
    const user = await verifySignIn(token, body.handle, email);
    return json({ user });
  } catch (e) {
    return json({ error: (e as Error).message || "This code is invalid or has expired." }, 400);
  }
}
