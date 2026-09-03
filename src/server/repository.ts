/**
 * The Repository interface — the single seam between the app and its datastore.
 *
 * The default implementation (jsonRepository) is file-backed with zero external
 * dependencies, so the whole backend self-hosts for free on any Node host.
 * Enterprises who want to own their data point DATABASE_DRIVER at a Prisma/Postgres
 * implementation of this same interface (see prisma/schema.prisma + docker-compose).
 */

import type {
  AuditEntry,
  MagicToken,
  Membership,
  Org,
  RoundEvent,
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

  // audit
  addAudit(a: AuditEntry): Promise<void>;
  listAudit(orgId: string): Promise<AuditEntry[]>;
}
