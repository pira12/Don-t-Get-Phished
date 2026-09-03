/**
 * Badge / achievement definitions. Each badge names the real skill it represents
 * so the gallery doubles as a learning checklist. Evaluation is pure.
 */

import type { RedFlagType } from "./types";

export type PlayerProfile = {
  totalAnswered: number;
  totalCorrect: number;
  bestStreak: number;
  falsePositives: number;
  /** Per-technique counts of phishing correctly caught. */
  techniqueCaught: Partial<Record<RedFlagType, number>>;
  /** Fastest correct reply-to-mismatch catch, in ms (Infinity if none). */
  fastestReplyToCatchMs: number;
  /** Emails answered correctly since the last false positive. */
  cleanRunNoFalsePositive: number;
  /** Rounds finished at 100% using headers on at least one email. */
  perfectHeaderRounds: number;
  dailyStreak: number;
};

export type Badge = {
  id: string;
  name: string;
  /** The concrete skill this badge certifies. */
  skill: string;
  /** Returns 0..1 progress toward the badge. */
  progress: (p: PlayerProfile) => number;
};

export const BADGES: Badge[] = [
  {
    id: "homoglyph_hunter",
    name: "Homoglyph Hunter",
    skill: "Spotted 10 lookalike / homoglyph domains",
    progress: (p) => clamp((p.techniqueCaught.lookalike_domain ?? 0) / 10),
  },
  {
    id: "unmoved",
    name: "Unmoved",
    skill: "Never fooled by an urgency lure",
    progress: (p) => clamp((p.techniqueCaught.urgency ?? 0) / 8),
  },
  {
    id: "header_forensics",
    name: "Header Forensics",
    skill: "Won a perfect round using Show Original",
    progress: (p) => clamp(p.perfectHeaderRounds / 1),
  },
  {
    id: "no_over_flag",
    name: "Cool Head",
    skill: "Zero false positives across 50 emails",
    progress: (p) => clamp(p.cleanRunNoFalsePositive / 50),
  },
  {
    id: "quick_draw",
    name: "Quick Draw",
    skill: "Caught a reply-to mismatch in under 5 seconds",
    progress: (p) => (p.fastestReplyToCatchMs <= 5000 ? 1 : 0),
  },
  {
    id: "credential_guard",
    name: "Credential Guard",
    skill: "Caught 10 credential-harvest links",
    progress: (p) => clamp((p.techniqueCaught.credential_harvest_link ?? 0) / 10),
  },
  {
    id: "attachment_aware",
    name: "Attachment Aware",
    skill: "Caught 5 malicious attachment lures",
    progress: (p) => clamp((p.techniqueCaught.attachment_lure ?? 0) / 5),
  },
  {
    id: "week_streak",
    name: "Daily Defender",
    skill: "Kept a 7-day training streak",
    progress: (p) => clamp(p.dailyStreak / 7),
  },
  {
    id: "centurion",
    name: "Centurion",
    skill: "Correctly judged 100 emails",
    progress: (p) => clamp(p.totalCorrect / 100),
  },
];

export function earnedBadges(p: PlayerProfile): Badge[] {
  return BADGES.filter((b) => b.progress(p) >= 1);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(1, n));
}
