import { randomBytes, randomUUID } from "node:crypto";

export function newId(prefix = ""): string {
  return prefix ? `${prefix}_${randomUUID()}` : randomUUID();
}

export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Human-friendly org join code, e.g. "PHISH-4KQ7X" (no ambiguous chars). */
export function newJoinCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) s += alphabet[bytes[i] % alphabet.length];
  return `PHISH-${s}`;
}
