/**
 * Validation + sanitisation for org-authored scenario emails. Because published
 * content renders (via innerHTML) for every member of the org, we sanitise the
 * body server-side as defense-in-depth against stored XSS from a rogue admin.
 *
 * NOTE: this is a conservative regex pass. A production deployment should run a
 * vetted sanitiser (e.g. DOMPurify in a jsdom worker) as well.
 */

import { TECHNIQUE_LABELS, type RedFlagType, type AuthResult } from "@/game/types";
import type { ServerEmail } from "./types";

const VALID_TECHNIQUES = new Set(Object.keys(TECHNIQUE_LABELS));
const AUTH_VALUES = new Set<AuthResult>(["pass", "fail", "softfail"]);

export function sanitizeHtml(html: string): string {
  let out = String(html || "");
  // Drop dangerous elements entirely.
  out = out.replace(/<\s*(script|style|iframe|object|embed|link|meta|base)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  out = out.replace(/<\s*(script|style|iframe|object|embed|link|meta|base)\b[^>]*\/?>/gi, "");
  // Remove inline event handlers (on*=...).
  out = out.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
  // Neutralise javascript:/vbscript:/data:text/html URIs in href/src.
  out = out.replace(/(href|src)\s*=\s*("|')\s*(javascript|vbscript|data:text\/html)[^"']*\2/gi, '$1="#"');
  return out;
}

function str(v: unknown, max: number): string {
  return String(v ?? "").slice(0, max);
}

export type ContentInput = {
  id?: string;
  truth?: string;
  difficulty?: string;
  from?: { name?: string; address?: string };
  replyTo?: string;
  to?: string;
  subject?: string;
  snippet?: string;
  bodyHtml?: string;
  links?: { text?: string; href?: string }[];
  attachments?: { name?: string; sizeKB?: number; suspicious?: boolean; reason?: string }[];
  auth?: { spf?: string; dkim?: string; dmarc?: string };
  firstTimeSender?: boolean;
  mailedBy?: string;
  signedBy?: string;
  redFlags?: { type?: string; anchor?: string; explanation?: string }[];
  legitSignals?: string[];
};

export type ValidationResult =
  | { ok: true; email: Omit<ServerEmail, "orgId" | "authorId" | "version" | "published" | "createdAt" | "updatedAt"> }
  | { ok: false; errors: string[] };

const auth = (v: unknown): AuthResult => (AUTH_VALUES.has(v as AuthResult) ? (v as AuthResult) : "fail");

export function validateEmailInput(input: ContentInput): ValidationResult {
  const errors: string[] = [];

  const truth = input.truth === "legit" ? "legit" : input.truth === "phishing" ? "phishing" : null;
  if (!truth) errors.push("truth must be 'phishing' or 'legit'");

  const difficulty =
    input.difficulty === "easy" || input.difficulty === "medium" || input.difficulty === "hard"
      ? input.difficulty
      : null;
  if (!difficulty) errors.push("difficulty must be easy, medium or hard");

  const fromName = str(input.from?.name, 80).trim();
  const fromAddress = str(input.from?.address, 120).trim();
  if (!fromName) errors.push("sender name is required");
  if (!/^[^@\s]+@[^@\s]+$/.test(fromAddress)) errors.push("sender address must look like name@domain");

  const subject = str(input.subject, 160).trim();
  if (!subject) errors.push("subject is required");

  const bodyHtml = sanitizeHtml(str(input.bodyHtml, 12000));
  if (!bodyHtml.trim()) errors.push("body is required");

  const redFlags = (input.redFlags ?? [])
    .filter((f) => f && f.type && VALID_TECHNIQUES.has(String(f.type)))
    .map((f) => ({
      type: f.type as RedFlagType,
      anchor: str(f.anchor, 200),
      explanation: str(f.explanation, 500),
    }));

  const legitSignals = (input.legitSignals ?? []).map((s) => str(s, 300)).filter(Boolean).slice(0, 10);

  if (truth === "phishing" && redFlags.length === 0) errors.push("phishing emails need at least one red flag");
  if (truth === "legit" && legitSignals.length === 0) errors.push("legit emails need at least one reassuring signal");

  if (errors.length) return { ok: false, errors };

  const links = (input.links ?? [])
    .filter((l) => l && (l.text || l.href))
    .map((l) => ({ text: str(l.text, 120), href: str(l.href, 400) }))
    .slice(0, 8);

  const attachments = (input.attachments ?? [])
    .filter((a) => a && a.name)
    .map((a) => ({
      name: str(a.name, 120),
      sizeKB: Math.max(0, Math.min(100000, Math.round(Number(a.sizeKB) || 0))),
      suspicious: !!a.suspicious,
      reason: str(a.reason, 300) || undefined,
    }))
    .slice(0, 5);

  return {
    ok: true,
    email: {
      id: str(input.id, 60) || "",
      truth: truth!,
      difficulty: difficulty!,
      from: { name: fromName, address: fromAddress },
      replyTo: str(input.replyTo, 120).trim() || undefined,
      to: str(input.to, 120).trim() || "you@northwind.example",
      subject,
      timestamp: new Date().toISOString(),
      snippet: str(input.snippet, 200).trim() || subject,
      bodyHtml,
      links,
      attachments: attachments.length ? attachments : undefined,
      auth: { spf: auth(input.auth?.spf), dkim: auth(input.auth?.dkim), dmarc: auth(input.auth?.dmarc) },
      firstTimeSender: !!input.firstTimeSender,
      mailedBy: str(input.mailedBy, 120).trim() || undefined,
      signedBy: str(input.signedBy, 120).trim() || undefined,
      redFlags,
      legitSignals: truth === "legit" ? legitSignals : undefined,
      techniqueTags: [...new Set(redFlags.map((f) => f.type))],
    },
  };
}
