/**
 * Server-side domain types. Framework-free so the same shapes back the default
 * file store (self-hosted, free, zero-dependency) and a Prisma/Postgres
 * implementation for enterprises who want to control their own database.
 */

import type { GameEmail, RedFlagType } from "@/game/types";

export type Role = "player" | "org_admin";

export type User = {
  id: string;
  handle: string;
  email: string | null;
  createdAt: string;
};

/** A magic-link token (stateless sessions are signed cookies; only the one-time
 * login token needs storage). */
export type MagicToken = {
  token: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
};

export type Org = {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
  settings: OrgSettings;
};

export type OrgSettings = {
  /** how names appear on leaderboards */
  leaderboardDisplay: "real" | "handle" | "anonymous";
  competitiveEnabled: boolean;
};

export type Membership = {
  userId: string;
  orgId: string;
  role: Role;
  team: string | null;
  joinedAt: string;
};

/** Per-technique counters, shared by the user mirror and org aggregates. */
export type TechniqueCounts = Partial<Record<RedFlagType, number>>;

/** Server mirror of a user's lifetime stats — powers all-time leaderboards and
 * the admin views. Kept in sync from the offline-first client. */
export type UserStats = {
  userId: string;
  xp: number;
  totalAnswered: number;
  totalCorrect: number;
  falsePositives: number;
  falseNegatives: number;
  bestStreak: number;
  techniqueSeen: TechniqueCounts;
  techniqueCaught: TechniqueCounts;
  lastActive: string;
};

/** Append-only record of a finished round — the source for time-boxed
 * leaderboards (weekly/seasonal) and the weakness heatmap. */
export type RoundEvent = {
  id: string;
  userId: string;
  orgId: string | null;
  at: string;
  difficulty: string;
  total: number;
  correct: number;
  points: number;
  falsePositives: number;
  falseNegatives: number;
  techniqueSeen: TechniqueCounts;
  techniqueCaught: TechniqueCounts;
};

/** Server-side ranked rating for online duels (Elo). */
export type DuelRating = {
  userId: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
};

export type AuditEntry = {
  id: string;
  orgId: string;
  actorId: string;
  action: string;
  detail: string;
  at: string;
};

/**
 * Org-authored scenario email (custom content editor). Extends the same GameEmail
 * schema employees play, plus versioning + publish state, scoped by org.
 */
export type ServerEmail = GameEmail & {
  orgId: string;
  version: number;
  authorId: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AssignmentDifficulty = "easy" | "medium" | "hard" | "mixed";

/** A training assignment an admin gives to individuals/teams/the whole org. */
export type Assignment = {
  id: string;
  orgId: string;
  createdBy: string;
  title: string;
  difficulty: AssignmentDifficulty;
  focusTechnique: RedFlagType | null;
  minAccuracy: number; // 0..1 target
  minRounds: number; // how many qualifying rounds to complete
  team: string | null; // null = whole org
  dueDate: string | null;
  createdAt: string;
};

/** Input the client sends when a round finishes. */
export type RoundSubmission = {
  difficulty: string;
  total: number;
  correct: number;
  points: number;
  falsePositives: number;
  falseNegatives: number;
  techniqueSeen: TechniqueCounts;
  techniqueCaught: TechniqueCounts;
};
