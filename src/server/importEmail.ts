/**
 * Safe ingestion of REAL emails (e.g. from a public phishing research corpus) into
 * editable draft scenarios. Nothing here ever renders live: the pipeline
 *   1. strips active content (scripts, handlers, javascript: URIs) via sanitizeHtml,
 *   2. DEFANGS remote resource loads (images / beacons / media) so no request can
 *      leak that a message was opened,
 *   3. keeps link *text* and destinations intact (the phishing lesson) — the reading
 *      pane never navigates, so those hrefs are inert,
 *   4. lightly redacts obvious personal data (long digit runs) in the body.
 *
 * The result is an unpublished DRAFT an admin reviews, tags and publishes — a human
 * is always in the loop. See the README "Using real phishing emails safely".
 */

import { sanitizeHtml, type ContentInput } from "./content";

/** Remove anything that would fetch a remote resource when the email is displayed. */
export function defangHtml(html: string): string {
  let out = sanitizeHtml(html);
  // Block remote images / tracking pixels — replace with an inert marker.
  out = out.replace(/<img\b[^>]*>/gi, '<span class="muted">[remote image blocked]</span>');
  out = out.replace(/<(source|video|audio|track|picture|svg|image)\b[^>]*>/gi, "");
  out = out.replace(/<\/(source|video|audio|track|picture|svg|image)\s*>/gi, "");
  // Strip CSS that pulls remote resources (background images, @import, url()).
  out = out.replace(/url\(([^)]*)\)/gi, "none");
  out = out.replace(/@import[^;]+;/gi, "");
  return out;
}

/** Light PII redaction: mask long digit runs (card/SSN-like) in visible text. */
export function redactPii(html: string): string {
  return html.replace(/\b(?:\d[ -]?){12,19}\b/g, "•••• redacted ••••");
}

type Headers = Record<string, string>;

function parseHeaders(block: string): Headers {
  const headers: Headers = {};
  // Unfold RFC-822 continuation lines, then split "Name: value".
  const unfolded = block.replace(/\r?\n[ \t]+/g, " ");
  for (const line of unfolded.split(/\r?\n/)) {
    const m = /^([A-Za-z-]+):\s*(.*)$/.exec(line);
    if (m && headers[m[1].toLowerCase()] === undefined) headers[m[1].toLowerCase()] = m[2].trim();
  }
  return headers;
}

function parseAddress(v: string): { name: string; address: string } {
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(v);
  if (m) return { name: m[1].trim(), address: m[2].trim() };
  return { name: v.includes("@") ? v.split("@")[0] : v.trim(), address: v.trim() };
}

function authFrom(results: string | undefined, key: "spf" | "dkim" | "dmarc"): "pass" | "fail" | "softfail" {
  if (!results) return "fail";
  const m = new RegExp(`${key}=([a-z]+)`, "i").exec(results);
  const v = m?.[1]?.toLowerCase();
  if (v === "pass") return "pass";
  if (v === "softfail") return "softfail";
  return "fail";
}

/**
 * Parse a pasted raw email (headers + blank line + body) into a safe, unpublished
 * draft. Falls back gracefully if only a body is pasted.
 */
export function buildDraftFromRaw(raw: string): ContentInput {
  const text = String(raw || "").replace(/\r\n/g, "\n");
  const split = text.indexOf("\n\n");
  const hasHeaders = /^[A-Za-z-]+:\s/.test(text) && split > 0;

  const headerBlock = hasHeaders ? text.slice(0, split) : "";
  const bodyRaw = hasHeaders ? text.slice(split + 2) : text;
  const h = parseHeaders(headerBlock);

  const from = h.from ? parseAddress(h.from) : { name: "", address: "" };
  const auth = h["authentication-results"];

  const looksHtml = /<\w+[\s>]/.test(bodyRaw);
  const bodyHtml = redactPii(defangHtml(looksHtml ? bodyRaw : `<p>${escapeText(bodyRaw).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`));

  return {
    // Real corpora are overwhelmingly phishing; the admin can flip this.
    truth: "phishing",
    difficulty: "medium",
    from: { name: from.name, address: from.address },
    replyTo: h["reply-to"] ? parseAddress(h["reply-to"]).address : undefined,
    to: "you@northwind.example", // never keep the real recipient
    subject: h.subject || "(imported email)",
    snippet: "",
    bodyHtml,
    links: [],
    auth: { spf: authFrom(auth, "spf"), dkim: authFrom(auth, "dkim"), dmarc: authFrom(auth, "dmarc") },
    firstTimeSender: true,
    mailedBy: from.address ? from.address.split("@")[1] : undefined,
    // Admin adds the teaching red flags on review.
    redFlags: [{ type: "credential_harvest_link", anchor: "", explanation: "" }],
  };
}

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
