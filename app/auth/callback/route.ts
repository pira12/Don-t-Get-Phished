import { NextResponse } from "next/server";
import { authProvider } from "@/server/config";
import { currentUser } from "@/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Supabase email-link landing. Clicking the magic link in the sign-in email
 * redirects here with a `?code=` (PKCE); we exchange it for a session (the
 * @supabase/ssr client sets the session cookies), mirror the profile, then bounce
 * home already signed in. Falls through to home if there's nothing to exchange.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const home = new URL("/", url.origin);

  if (authProvider === "supabase" && code) {
    const { serverClient } = await import("@/server/supabase");
    const { error } = await serverClient().auth.exchangeCodeForSession(code);
    if (!error) {
      // Provision the profile row now so the first /auth/me is warm.
      await currentUser().catch(() => null);
    } else {
      home.searchParams.set("auth_error", "1");
    }
  }
  return NextResponse.redirect(home);
}
