/**
 * Core game types. These are framework-free so the scoring / verdict / XP logic
 * can be unit-tested in isolation and reused by a future server implementation.
 */

export type Truth = "phishing" | "legit";
export type Difficulty = "easy" | "medium" | "hard";
export type Verdict = "phishing" | "legit";

export type AuthResult = "pass" | "fail" | "softfail";

export type RedFlagType =
  // email-era techniques (still used across channels where relevant)
  | "lookalike_domain"
  | "display_name_spoof"
  | "reply_to_mismatch"
  | "urgency"
  | "credential_harvest_link"
  | "auth_fail"
  | "attachment_lure"
  | "generic_greeting"
  | "unexpected_request"
  // cross-channel social-engineering techniques
  | "smishing_link"
  | "otp_theft"
  | "caller_id_spoof"
  | "pretext_authority"
  | "callback_number"
  | "payment_fraud"
  | "qr_redirect"
  | "fake_login_page"
  | "impersonation";

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
  smishing_link: "Smishing link (SMS)",
  otp_theft: "One-time-code / MFA theft",
  caller_id_spoof: "Caller-ID spoofing",
  pretext_authority: "Authority pretext (IT / bank / boss)",
  callback_number: "Fake callback number",
  payment_fraud: "Payment / gift-card fraud",
  qr_redirect: "Malicious QR code (quishing)",
  fake_login_page: "Fake login / credential page",
  impersonation: "Identity impersonation",
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

// ---------------------------------------------------------------------------
// Multi-channel social engineering
//
// The engine (scoring, XP, rounds, stats) only ever reads `truth`, `difficulty`,
// `redFlags`, `techniqueTags` and `id`, so it works unchanged for every channel.
// Each channel below adds only the fields its own surface needs to render.
// ---------------------------------------------------------------------------

export type Channel = "email" | "sms" | "call" | "chat" | "web";

/** Everything the engine needs, common to every channel. */
export type ScenarioBase = {
  id: string;
  channel: Channel;
  truth: Truth;
  difficulty: Difficulty;
  /** One-line summary shown in the round rail / summary. */
  title: string;
  redFlags: RedFlag[];
  legitSignals?: string[];
  techniqueTags?: RedFlagType[];
  orgId?: string | null;
  version?: number;
};

/** A single SMS/iMessage-style bubble. */
export type SmsMessage = { text: string; link?: EmailLink };

export type SmsScenario = ScenarioBase & {
  channel: "sms";
  /** Sender as it appears in the phone: a number, short-code, or spoofed name. */
  sender: string;
  /** True when the phone shows this as a saved/known contact. */
  knownContact?: boolean;
  timestamp: string;
  messages: SmsMessage[];
};

export type CallLine = { speaker: "caller" | "you"; text: string };

export type CallScenario = ScenarioBase & {
  channel: "call";
  callerName: string;
  callerNumber: string;
  /** What the phone's caller-ID claims (may be spoofed). */
  claimedOrg?: string;
  /** A voicemail plays as a monologue; a live call as a back-and-forth. */
  kind: "live" | "voicemail";
  transcript: CallLine[];
  /** The core thing the caller is trying to get. */
  ask: string;
};

export type ChatPlatform = "slack" | "teams" | "whatsapp" | "instagram" | "linkedin";
export type ChatMessage = { from: "them" | "you"; text: string; time: string; link?: EmailLink };

export type ChatScenario = ScenarioBase & {
  channel: "chat";
  platform: ChatPlatform;
  senderName: string;
  /** @handle / phone / title shown under the name. */
  senderHandle: string;
  /** True when the platform shows a verified/known badge. */
  verified?: boolean;
  messages: ChatMessage[];
};

export type WebScenario = ScenarioBase & {
  channel: "web";
  /** How the victim arrived: scanning a QR or following a link. */
  entry: "qr" | "link";
  /** Where the QR/link came from (a poster caption, an email line, etc.). */
  entryContext: string;
  /** The URL the browser lands on — the address bar is the whole lesson. */
  url: string;
  /** For a QR: the human-facing label printed next to the code. */
  qrLabel?: string;
  pageTitle: string;
  brandImitated: string;
  https: boolean;
  /** True when the page asks for credentials / OTP / card details. */
  asksForSecrets: boolean;
};

/** Any non-email channel scenario. Email keeps its own richer GameEmail shape. */
export type Scenario = SmsScenario | CallScenario | ChatScenario | WebScenario;
