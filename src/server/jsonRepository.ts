/**
 * Default datastore: a single JSON file on disk. Zero external services, so the
 * backend self-hosts for free anywhere Node runs. A tiny write queue serialises
 * mutations; reads are served from an in-memory cache. Good for a single node and
 * modest teams; enterprises swap in the Prisma/Postgres repository for scale.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Repository } from "./repository";
import type {
  AuditEntry,
  MagicToken,
  Membership,
  Org,
  RoundEvent,
  User,
  UserStats,
} from "./types";

type DB = {
  users: Record<string, User>;
  tokens: Record<string, MagicToken>;
  stats: Record<string, UserStats>;
  events: RoundEvent[];
  orgs: Record<string, Org>;
  memberships: Membership[];
  audit: AuditEntry[];
};

const EMPTY: DB = {
  users: {},
  tokens: {},
  stats: {},
  events: [],
  orgs: {},
  memberships: [],
  audit: [],
};

const DATA_FILE =
  process.env.DATA_FILE || join(process.cwd(), ".data", "izd-db.json");

class JsonRepository implements Repository {
  private cache: DB | null = null;
  private writeChain: Promise<void> = Promise.resolve();

  private async load(): Promise<DB> {
    if (this.cache) return this.cache;
    try {
      const raw = await readFile(DATA_FILE, "utf8");
      this.cache = { ...EMPTY, ...(JSON.parse(raw) as Partial<DB>) };
    } catch {
      this.cache = structuredClone(EMPTY);
    }
    return this.cache!;
  }

  /** Serialise a read-modify-write against the cache + file. */
  private mutate<T>(fn: (db: DB) => T): Promise<T> {
    const run = async (): Promise<T> => {
      const db = await this.load();
      const result = fn(db);
      await mkdir(dirname(DATA_FILE), { recursive: true });
      await writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
      return result;
    };
    const p = this.writeChain.then(run, run);
    // keep the chain alive regardless of individual failures
    this.writeChain = p.then(
      () => undefined,
      () => undefined,
    );
    return p;
  }

  async getUser(id: string) {
    return (await this.load()).users[id] ?? null;
  }
  async getUserByEmail(email: string) {
    const db = await this.load();
    return Object.values(db.users).find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
  }
  async getUserByHandle(handle: string) {
    const db = await this.load();
    return Object.values(db.users).find((u) => u.handle.toLowerCase() === handle.toLowerCase()) ?? null;
  }
  async createUser(u: User) {
    return this.mutate((db) => {
      db.users[u.id] = u;
      return u;
    });
  }
  async updateUser(id: string, patch: Partial<User>) {
    return this.mutate((db) => {
      const cur = db.users[id];
      if (!cur) return null;
      db.users[id] = { ...cur, ...patch };
      return db.users[id];
    });
  }

  async createToken(t: MagicToken) {
    await this.mutate((db) => {
      db.tokens[t.token] = t;
    });
  }
  async getToken(token: string) {
    return (await this.load()).tokens[token] ?? null;
  }
  async markTokenUsed(token: string) {
    await this.mutate((db) => {
      if (db.tokens[token]) db.tokens[token].usedAt = new Date().toISOString();
    });
  }

  async getStats(userId: string) {
    return (await this.load()).stats[userId] ?? null;
  }
  async putStats(s: UserStats) {
    await this.mutate((db) => {
      db.stats[s.userId] = s;
    });
  }
  async listStats(userIds?: string[]) {
    const db = await this.load();
    const all = Object.values(db.stats);
    if (!userIds) return all;
    const set = new Set(userIds);
    return all.filter((s) => set.has(s.userId));
  }

  async addRoundEvent(e: RoundEvent) {
    await this.mutate((db) => {
      db.events.push(e);
      // keep the file bounded on a self-hosted single node
      if (db.events.length > 20000) db.events = db.events.slice(-20000);
    });
  }
  async listRoundEvents(filter: { orgId?: string | null; since?: string }) {
    const db = await this.load();
    return db.events.filter((e) => {
      if (filter.orgId !== undefined && e.orgId !== filter.orgId) return false;
      if (filter.since && e.at < filter.since) return false;
      return true;
    });
  }

  async createOrg(o: Org) {
    return this.mutate((db) => {
      db.orgs[o.id] = o;
      return o;
    });
  }
  async getOrg(id: string) {
    return (await this.load()).orgs[id] ?? null;
  }
  async getOrgByJoinCode(code: string) {
    const db = await this.load();
    return Object.values(db.orgs).find((o) => o.joinCode.toLowerCase() === code.toLowerCase()) ?? null;
  }
  async updateOrg(id: string, patch: Partial<Org>) {
    return this.mutate((db) => {
      const cur = db.orgs[id];
      if (!cur) return null;
      db.orgs[id] = { ...cur, ...patch };
      return db.orgs[id];
    });
  }
  async addMembership(m: Membership) {
    await this.mutate((db) => {
      const exists = db.memberships.find((x) => x.userId === m.userId && x.orgId === m.orgId);
      if (!exists) db.memberships.push(m);
    });
  }
  async getMembership(userId: string, orgId: string) {
    const db = await this.load();
    return db.memberships.find((m) => m.userId === userId && m.orgId === orgId) ?? null;
  }
  async listMemberships(filter: { userId?: string; orgId?: string }) {
    const db = await this.load();
    return db.memberships.filter((m) => {
      if (filter.userId && m.userId !== filter.userId) return false;
      if (filter.orgId && m.orgId !== filter.orgId) return false;
      return true;
    });
  }

  async addAudit(a: AuditEntry) {
    await this.mutate((db) => {
      db.audit.push(a);
    });
  }
  async listAudit(orgId: string) {
    const db = await this.load();
    return db.audit.filter((a) => a.orgId === orgId).sort((x, y) => (x.at < y.at ? 1 : -1));
  }
}

/** Reuse one instance across hot-reloads in dev. */
const g = globalThis as unknown as { __izdRepo?: JsonRepository };
export const jsonRepository: Repository = g.__izdRepo ?? (g.__izdRepo = new JsonRepository());
