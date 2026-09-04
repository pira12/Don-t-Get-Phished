/**
 * The Repository interface — the single seam between the app and its datastore.
 *
 * Production uses supabaseRepository (Postgres). Local dev / CI use jsonRepository,
 * a file-backed store with zero external dependencies, so the app runs with no
 * services. Nothing else in the app talks to a database directly — swapping drivers
 * (src/server/db.ts) changes nothing downstream.
 */

import type {
  Assignment,
  AuditEntry,
  DuelRating,
  MagicToken,
  Membership,
  Org,
  RoundEvent,
  ServerEmail,
  User,
  UserStats,
} from "./types";

export interface Repository {
  // users
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByHandle(handle: string): Promise<User | null>;
  createUser(u: User): Promise<User>;
  updateUser(id: string, patch: Partial<User>): Promise<User | null>;

  // magic-link tokens
  createToken(t: MagicToken): Promise<void>;
  getToken(token: string): Promise<MagicToken | null>;
  markTokenUsed(token: string): Promise<void>;

  // stats mirror
  getStats(userId: string): Promise<UserStats | null>;
  putStats(s: UserStats): Promise<void>;
  listStats(userIds?: string[]): Promise<UserStats[]>;

  // round events (append-only)
  addRoundEvent(e: RoundEvent): Promise<void>;
  listRoundEvents(filter: { orgId?: string | null; since?: string }): Promise<RoundEvent[]>;

  // orgs + memberships
  createOrg(o: Org): Promise<Org>;
  getOrg(id: string): Promise<Org | null>;
  getOrgByJoinCode(code: string): Promise<Org | null>;
  updateOrg(id: string, patch: Partial<Org>): Promise<Org | null>;
  addMembership(m: Membership): Promise<void>;
  getMembership(userId: string, orgId: string): Promise<Membership | null>;
  listMemberships(filter: { userId?: string; orgId?: string }): Promise<Membership[]>;

  // custom content (org-authored scenario emails)
  createEmail(e: ServerEmail): Promise<ServerEmail>;
  getEmail(id: string): Promise<ServerEmail | null>;
  updateEmail(id: string, patch: Partial<ServerEmail>): Promise<ServerEmail | null>;
  deleteEmail(id: string): Promise<void>;
  listEmails(filter: { orgId: string; publishedOnly?: boolean }): Promise<ServerEmail[]>;

  // assignments
  createAssignment(a: Assignment): Promise<Assignment>;
  getAssignment(id: string): Promise<Assignment | null>;
  listAssignments(orgId: string): Promise<Assignment[]>;
  deleteAssignment(id: string): Promise<void>;

  // online-duel ratings (Elo)
  getDuelRating(userId: string): Promise<DuelRating | null>;
  putDuelRating(r: DuelRating): Promise<void>;

  // audit
  addAudit(a: AuditEntry): Promise<void>;
  listAudit(orgId: string): Promise<AuditEntry[]>;
}
