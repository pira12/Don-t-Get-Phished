/**
 * Core game types. These are framework-free so the scoring / verdict / XP logic
 * can be unit-tested in isolation and reused by a future server implementation.
 */

export type Truth = "phishing" | "legit";
export type Difficulty = "easy" | "medium" | "hard";
export type Verdict = "phishing" | "legit";

export type AuthResult = "pass" | "fail" | "softfail";

export type RedFlagType =
  | "lookalike_domain"
  | "display_name_spoof"
  | "reply_to_mismatch"
  | "urgency"
  | "credential_harvest_link"
  | "auth_fail"
  | "attachment_lure"
  | "generic_greeting"
  | "unexpected_request";

/** Human-readable names for each technique, used across feedback, stats, badges. */
export const TECHNIQUE_LABELS: Record<RedFlagType, string> = {
  lookalike_domain: "Lookalike / homoglyph domain",
  display_name_spoof: "Display-name spoofing",
  reply_to_mismatch: "Reply-to mismatch",
  urgency: "Urgency / fear / authority pressure",
  credential_harvest_link: "Credential-harvest link",
  auth_fail: "Authentication failure (SPF/DKIM/DMARC)",
  attachment_lure: "Attachment lure",
  generic_greeting: "Generic greeting",
  unexpected_request: "Unexpected / unusual request",
};

export type EmailLink = {
  /** What the reader sees. */
  text: string;
  /** The REAL destination — the whole point of the hover-to-reveal tool. */
  href: string;
};

export type Attachment = {
  name: string;
  sizeKB: number;
  suspicious?: boolean;
  /** Why it is suspicious — shown in the attachment inspector / feedback. */
  reason?: string;
};

export type RedFlag = {
  type: RedFlagType;
  /** Substring of the body/header to locate + highlight when the chip is clicked. */
  anchor: string;
  explanation: string;
};

export type EmailAuth = {
  spf: AuthResult;
  dkim: AuthResult;
  dmarc: AuthResult;
};

export type GameEmail = {
  id: string;
  /** null = built-in / global; a real orgId in the multi-tenant backend. */
  orgId?: string | null;
  version?: number;
  truth: Truth;
  difficulty: Difficulty;
  from: { name: string; address: string };
  replyTo?: string;
  to: string;
  subject: string;
  timestamp: string;
  snippet: string;
  bodyHtml: string;
  links: EmailLink[];
  attachments?: Attachment[];
  auth: EmailAuth;
  firstTimeSender?: boolean;
  /** Fictional "mailed-by" server, shown in the sender detail table. */
  mailedBy?: string;
  /** Fictional signing domain shown in the sender detail table. */
  signedBy?: string;
  redFlags: RedFlag[];
  /** Reassuring signals shown in feedback for legit emails. */
  legitSignals?: string[];
  techniqueTags?: RedFlagType[];
};
