import { badRequest, json } from "@/server/http";
import { consumeMagicToken, setSessionCookie } from "@/server/auth";
import { db } from "@/server/db";
import { newId } from "@/server/ids";
import type { User } from "@/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Verify a magic token, creating the account on first sign-in and reserving the
 * handle. Returns the user; a session cookie is set. */
export async function POST(req: Request) {
  let body: { token?: string; handle?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }
  const token = (body.token || "").trim();
  if (!token) return badRequest("Missing token");

  const email = await consumeMagicToken(token);
  if (!email) return json({ error: "This link is invalid or has expired." }, 400);

  let user = await db.getUserByEmail(email);
  if (!user) {
    const desired = (body.handle || email.split("@")[0]).slice(0, 20).trim();
    const handle = await uniqueHandle(desired);
    const u: User = {
      id: newId("usr"),
      handle,
      email,
      createdAt: new Date().toISOString(),
    };
    user = await db.createUser(u);
  }

  setSessionCookie(user.id);
  return json({ user });
}

async function uniqueHandle(desired: string): Promise<string> {
  const base = desired || "player";
  if (!(await db.getUserByHandle(base))) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}${i}`.slice(0, 20);
    if (!(await db.getUserByHandle(candidate))) return candidate;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
