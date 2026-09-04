/**
 * Auth. Two providers, selected by config:
 *  - supabase (production): Supabase Auth email OTP. Supabase owns the session
 *    (its own cookies via @supabase/ssr); we mirror each user into a `profiles`
 *    row on first sign-in and read the session with the cookie-bound client.
 *  - dev (local / CI, when Supabase env vars are absent): a stateless HMAC-signed
 *    session cookie plus one-time magic-link tokens, zero external services.
 *
 * Everything downstream only calls currentUser() / the sign-in helpers, so the
 * provider swap is invisible to routes and the client.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { newId, newToken } from "./ids";
import { authProvider, isProd } from "./config";
import type { MagicToken, User } from "./types";

const COOKIE = "izd_session";
const SESSION_TTL_DAYS = 30;
const TOKEN_TTL_MINUTES = 30;
const DEV_SECRET = "izd-dev-secret-change-me";

function secret(): string {
  const s = process.env.AUTH_SECRET;
  // The dev magic-link cookie must never be signed with the shared default in a
  // real deployment — that would let anyone forge a session. Supabase-backed
  // production doesn't use this codepath (Supabase issues its own JWTs); this
  // only guards the fallback dev auth if it is ever run in production.
  if (isProd && authProvider === "dev" && (!s || s === DEV_SECRET)) {
    throw new Error(
      "AUTH_SECRET must be set to a strong, unique value in production. " +
        "Configure Supabase (recommended) or set AUTH_SECRET before starting the server.",
    );
  }
  return s || DEV_SECRET;
}

function sign(payload: string): string {
  const mac = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

function verifySig(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = signed.slice(0, idx);
  const mac = signed.slice(idx + 1);
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return payload;
}

/** payload = `${userId}:${expiryMs}` */
export function makeSessionValue(userId: string): string {
  const expiry = Date.now() + SESSION_TTL_DAYS * 86_400_000;
  return sign(`${userId}:${expiry}`);
}

export function readSessionValue(signed: string | undefined): string | null {
  if (!signed) return null;
  const payload = verifySig(signed);
  if (!payload) return null;
  const [userId, expiry] = payload.split(":");
  if (!userId || !expiry) return null;
  if (Date.now() > Number(expiry)) return null;
  return userId;
}

export function setSessionCookie(userId: string): void {
  cookies().set(COOKIE, makeSessionValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86_400,
  });
}

export function clearSessionCookie(): void {
  cookies().delete(COOKIE);
}

/** Reserve a unique handle derived from `desired`. */
export async function uniqueHandle(desired: string): Promise<string> {
  const base = (desired || "player").slice(0, 20).trim() || "player";
  if (!(await db.getUserByHandle(base))) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}${i}`.slice(0, 20);
    if (!(await db.getUserByHandle(candidate))) return candidate;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Resolve the current user (or null for a guest). */
export async function currentUser(): Promise<User | null> {
  if (authProvider === "supabase") {
    const { serverClient } = await import("./supabase");
    const { data } = await serverClient().auth.getUser();
    const authUser = data.user;
    if (!authUser) return null;
    return ensureSupabaseProfile(authUser.id, authUser.email ?? null);
  }
  const signed = cookies().get(COOKIE)?.value;
  const userId = readSessionValue(signed);
  if (!userId) return null;
  return db.getUser(userId);
}

/** Find or create the profile row for a Supabase auth user. */
async function ensureSupabaseProfile(id: string, email: string | null): Promise<User> {
  const existing = await db.getUser(id);
  if (existing) return existing;
  const desired = (email?.split("@")[0] || "player").slice(0, 20);
  const handle = await uniqueHandle(desired);
  return db.createUser({ id, handle, email, createdAt: new Date().toISOString() });
}

// --- sign-in flow (provider-agnostic) -----------------------------------------

export type RequestResult = { emailSent: boolean; devToken?: string };

/** Step 1: send a sign-in code/link to `email`. */
export async function requestSignIn(email: string, origin: string): Promise<RequestResult> {
  if (authProvider === "supabase") {
    const { serverClient } = await import("./supabase");
    const { error } = await serverClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback`, shouldCreateUser: true },
    });
    if (error) throw new Error(error.message);
    return { emailSent: true };
  }
  // dev magic-link
  const token = await issueMagicToken(email);
  const emailEnabled = process.env.EMAIL_ENABLED === "1";
  return { emailSent: emailEnabled, devToken: emailEnabled ? undefined : token.token };
}

/** Step 2: verify the code/token; creates the account on first sign-in. Returns
 * the user. The session is established as a side effect (provider-specific). */
export async function verifySignIn(token: string, handle?: string, email?: string): Promise<User> {
  if (authProvider === "supabase") {
    if (!email) throw new Error("Email is required to verify the code.");
    const { serverClient } = await import("./supabase");
    const client = serverClient();
    const { data, error } = await client.auth.verifyOtp({ email, token, type: "email" });
    if (error || !data.user) throw new Error(error?.message || "This code is invalid or has expired.");
    // verifyOtp set the Supabase session cookies; mirror the profile.
    const user = await ensureSupabaseProfile(data.user.id, data.user.email ?? email);
    if (handle && user.handle !== handle) {
      // best-effort: only if the desired handle is free
      const free = !(await db.getUserByHandle(handle));
      if (free) await db.updateUser(user.id, { handle: handle.slice(0, 20) });
    }
    return (await db.getUser(user.id)) || user;
  }

  // dev magic-link
  const verifiedEmail = await consumeMagicToken(token);
  if (!verifiedEmail) throw new Error("This link is invalid or has expired.");
  let user = await db.getUserByEmail(verifiedEmail);
  if (!user) {
    const h = await uniqueHandle(handle || verifiedEmail.split("@")[0]);
    user = await db.createUser({
      id: newId("usr"),
      handle: h,
      email: verifiedEmail,
      createdAt: new Date().toISOString(),
    });
  }
  setSessionCookie(user.id);
  return user;
}

/** End the current session (provider-specific). */
export async function endSession(): Promise<void> {
  if (authProvider === "supabase") {
    const { serverClient } = await import("./supabase");
    await serverClient().auth.signOut();
    return;
  }
  clearSessionCookie();
}

// --- dev magic link (internal) ------------------------------------------------

export async function issueMagicToken(email: string): Promise<MagicToken> {
  const now = Date.now();
  const token: MagicToken = {
    token: newToken(),
    email: email.toLowerCase(),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TOKEN_TTL_MINUTES * 60_000).toISOString(),
    usedAt: null,
  };
  await db.createToken(token);
  return token;
}

export async function consumeMagicToken(token: string): Promise<string | null> {
  const t = await db.getToken(token);
  if (!t || t.usedAt) return null;
  if (Date.now() > new Date(t.expiresAt).getTime()) return null;
  await db.markTokenUsed(token);
  return t.email;
}
