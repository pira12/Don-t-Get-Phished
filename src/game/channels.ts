/**
 * Channel definitions for the multi-channel social-engineering game.
 *
 * Pure + framework-free (no React), so it stays unit-testable and reusable.
 *
 * The key design move: every channel's real-world responses map onto the SAME
 * three canonical actions the email game already scores — `report` (treat it as a
 * threat), `archive` (trust and proceed), `delete` (a neutral middle). That lets
 * `evaluateAction` / `actionOutcome` and the whole XP + stats pipeline work for SMS,
 * calls, chat and web with zero changes; only the labels differ per channel.
 */

import type { Channel, Truth } from "./types";
import type { ActionQuality, MailAction } from "./scoring";

export type ChannelMeta = {
  channel: Channel;
  /** Short label for the switcher / summaries. */
  label: string;
  /** lucide icon name, resolved to a component on the UI side. */
  icon: string;
  /** One-line description of the vector. */
  blurb: string;
  /** The real-world thing this surface imitates. */
  surface: string;
};

export const CHANNELS: Record<Channel, ChannelMeta> = {
  email: {
    channel: "email",
    label: "Email",
    icon: "Mail",
    blurb: "Classic phishing: spoofed senders, lookalike domains, credential links.",
    surface: "Gmail / Outlook inbox",
  },
  sms: {
    channel: "sms",
    label: "SMS",
    icon: "MessageSquare",
    blurb: "Smishing: fake delivery, bank and one-time-code texts with short links.",
    surface: "Phone Messages app",
  },
  call: {
    channel: "call",
    label: "Calls",
    icon: "Phone",
    blurb: "Vishing: fake IT, bank fraud teams and 'your boss' — live or voicemail.",
    surface: "Incoming call & voicemail",
  },
  chat: {
    channel: "chat",
    label: "Chat / DM",
    icon: "MessagesSquare",
    blurb: "Impersonation on Slack, Teams, WhatsApp and social DMs.",
    surface: "Team chat & social DMs",
  },
  web: {
    channel: "web",
    label: "QR & Web",
    icon: "QrCode",
    blurb: "Quishing and fake login pages — read the address bar before you type.",
    surface: "QR scan & browser",
  },
};

/** Display order for the channel switcher. */
export const CHANNEL_ORDER: Channel[] = ["email", "sms", "call", "chat", "web"];

export type ChannelAction = {
  /** Canonical action the scorer understands. */
  canonical: MailAction;
  label: string;
  /** lucide icon name. */
  icon: string;
  /** Tone hint for styling: danger = "treat as threat", neutral, safe = "trust". */
  tone: "danger" | "neutral" | "safe";
  /** Short helper shown under the label. */
  hint?: string;
  /** Keyboard shortcut, mirrors the email bar where possible. */
  shortcut?: string;
};

/**
 * The action bar for each channel. Order is intentional: threat action first,
 * then the trust action, then the neutral middle — matching the email bar.
 */
export const CHANNEL_ACTIONS: Record<Channel, ChannelAction[]> = {
  email: [
    { canonical: "report", label: "Report phishing", icon: "ShieldAlert", tone: "danger", shortcut: "!" },
    { canonical: "archive", label: "Archive", icon: "Archive", tone: "safe", hint: "looks safe", shortcut: "E" },
    { canonical: "delete", label: "Delete", icon: "Trash2", tone: "neutral", shortcut: "#" },
  ],
  sms: [
    { canonical: "report", label: "Report junk", icon: "ShieldAlert", tone: "danger", hint: "block sender", shortcut: "!" },
    { canonical: "archive", label: "Keep", icon: "Check", tone: "safe", hint: "it's genuine", shortcut: "E" },
    { canonical: "delete", label: "Delete", icon: "Trash2", tone: "neutral", shortcut: "#" },
  ],
  call: [
    { canonical: "report", label: "Refuse & verify", icon: "ShieldAlert", tone: "danger", hint: "call back on the official number", shortcut: "!" },
    { canonical: "archive", label: "Trust & continue", icon: "Check", tone: "safe", hint: "it's a real call", shortcut: "E" },
    { canonical: "delete", label: "Just hang up", icon: "PhoneOff", tone: "neutral", shortcut: "#" },
  ],
  chat: [
    { canonical: "report", label: "Report / block", icon: "ShieldAlert", tone: "danger", shortcut: "!" },
    { canonical: "archive", label: "Reply / comply", icon: "Check", tone: "safe", hint: "it's really them", shortcut: "E" },
    { canonical: "delete", label: "Ignore", icon: "Trash2", tone: "neutral", shortcut: "#" },
  ],
  web: [
    { canonical: "report", label: "Leave & report", icon: "ShieldAlert", tone: "danger", hint: "don't enter anything", shortcut: "!" },
    { canonical: "archive", label: "Proceed & sign in", icon: "Check", tone: "safe", hint: "the site is genuine", shortcut: "E" },
    { canonical: "delete", label: "Just close it", icon: "Trash2", tone: "neutral", shortcut: "#" },
  ],
};

/**
 * Channel-aware coaching line for the feedback panel. Mirrors the email game's
 * teaching voice: reward the ideal action, gently correct the rest.
 */
export function actionCoaching(
  channel: Channel,
  truth: Truth,
  action: MailAction,
  _quality?: ActionQuality,
): string {
  const threat = truth === "phishing";
  switch (channel) {
    case "sms":
      if (threat)
        return action === "report"
          ? "You reported and blocked it — exactly right. Never tap links in an unexpected text."
          : action === "delete"
            ? "Deleting is safe, but reporting junk also warns your carrier and others. (Half points.)"
            : "You kept a scam text as if it were genuine — it was smishing. Report and block it.";
      return action === "archive"
        ? "You kept it — correct. This was a genuine message."
        : action === "delete"
          ? "Real message; deleting is fine but unnecessary. (Half points.)"
          : "You reported a genuine text. Over-blocking means missing real messages.";
    case "call":
      if (threat)
        return action === "report"
          ? "You refused and offered to call back on the official number — the one move that beats vishing."
          : action === "delete"
            ? "Hanging up stopped the scam, but always verify via the official number so a real issue isn't missed. (Half points.)"
            : "You trusted a scam caller — that's how vishing works. Never share codes or act on an inbound call; verify first.";
      return action === "archive"
        ? "You trusted a genuine call — fine. (In real life you can still verify sensitive requests.)"
        : action === "delete"
          ? "It was genuine; hanging up works but you could have handled it. (Half points.)"
          : "You treated a real call as fraud. Verifying is good, but this one was legitimate.";
    case "chat":
      if (threat)
        return action === "report"
          ? "You reported and blocked the impersonator — right. Verify unusual asks through a second channel."
          : action === "delete"
            ? "Ignoring is safe, but reporting stops them targeting a colleague next. (Half points.)"
            : "You complied with an impersonator — that's the scam. Gift cards, transfers and resets need out-of-band verification.";
      return action === "archive"
        ? "You replied to a genuine colleague — correct."
        : action === "delete"
          ? "It was genuine; ignoring works but a reply was fine. (Half points.)"
          : "You reported a real teammate. Check the profile before escalating.";
    case "web":
    default:
      if (threat)
        return action === "report"
          ? "You left without entering anything — perfect. The address bar, not the page, tells the truth."
          : action === "delete"
            ? "Closing it kept you safe, but flag it so the site gets taken down. (Half points.)"
            : "You entered your details on a fake page — the credentials are now the attacker's. Always check the domain first.";
      return action === "archive"
        ? "You signed in on the genuine site — correct."
        : action === "delete"
          ? "The site was real; closing it works but was unnecessary. (Half points.)"
          : "You abandoned a legitimate site. Reading the address bar would have reassured you.";
  }
}
