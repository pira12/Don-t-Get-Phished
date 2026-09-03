/**
 * Lightweight, dependency-free auth: a stateless HMAC-signed session cookie plus
 * one-time magic-link tokens. No SSO, no password store — matches the brief's
 * "deliberately lightweight identity". Enterprises can layer SSO on top later.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { newToken } from "./ids";
import type { MagicToken, User } from "./types";

const COOKIE = "izd_session";
const SESSION_TTL_DAYS = 30;
const TOKEN_TTL_MINUTES = 30;

function secret(): string {
  return process.env.AUTH_SECRET || "izd-dev-secret-change-me";
}

function sign(payload: string): string {
  const mac = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

function verify(signed: string): string | null {
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
  const payload = verify(signed);
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
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86_400,
  });
}

export function clearSessionCookie(): void {
  cookies().delete(COOKIE);
}

/** Resolve the current user from the request cookie (or null for a guest). */
export async function currentUser(): Promise<User | null> {
  const signed = cookies().get(COOKIE)?.value;
  const userId = readSessionValue(signed);
  if (!userId) return null;
  return db.getUser(userId);
}

// --- magic link ---------------------------------------------------------------

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
