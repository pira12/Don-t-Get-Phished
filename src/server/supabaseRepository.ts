/**
 * Supabase (Postgres) implementation of the Repository interface — the production
 * datastore. Uses the service-role client (bypasses RLS); every /api route does
 * its own authz before calling in. Nested/variable structures (settings, technique
 * maps, the GameEmail body) are stored as jsonb so the schema stays small and the
 * TS types remain the source of truth.
 *
 * Magic-token methods are unused under Supabase (Supabase Auth issues its own email
 * OTP) and intentionally throw if reached — the auth routes branch away from them.
 */

import type { Repository } from "./repository";
import { serviceClient } from "./supabase";
import type {
  Assignment,
  AuditEntry,
  DuelRating,
  MagicToken,
  Membership,
  Org,
  OrgPlan,
  RoundEvent,
  ServerEmail,
  TechniqueCounts,
  User,
  UserStats,
} from "./types";
import type { GameEmail } from "@/game/types";

const sb = () => serviceClient();

// --- row <-> domain mappers ---------------------------------------------------

type ProfileRow = { id: string; handle: string; email: string | null; created_at: string };
const toUser = (r: ProfileRow): User => ({ id: r.id, handle: r.handle, email: r.email, createdAt: r.created_at });
const fromUser = (u: User): ProfileRow => ({ id: u.id, handle: u.handle, email: u.email, created_at: u.createdAt });

type OrgRow = {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
  settings: Org["settings"];
  plan: OrgPlan;
};
const toOrg = (r: OrgRow): Org => ({
  id: r.id,
  name: r.name,
  joinCode: r.join_code,
  createdAt: r.created_at,
  settings: r.settings,
  plan: r.plan ?? "free",
});
const fromOrg = (o: Org): OrgRow => ({
  id: o.id,
  name: o.name,
  join_code: o.joinCode,
  created_at: o.createdAt,
  settings: o.settings,
  plan: o.plan ?? "free",
});

type MembershipRow = { user_id: string; org_id: string; role: Membership["role"]; team: string | null; joined_at: string };
const toMembership = (r: MembershipRow): Membership => ({
  userId: r.user_id,
  orgId: r.org_id,
  role: r.role,
  team: r.team,
  joinedAt: r.joined_at,
});
const fromMembership = (m: Membership): MembershipRow => ({
  user_id: m.userId,
  org_id: m.orgId,
  role: m.role,
  team: m.team,
  joined_at: m.joinedAt,
});

type StatsRow = {
  user_id: string;
  xp: number;
  total_answered: number;
  total_correct: number;
  false_positives: number;
  false_negatives: number;
  best_streak: number;
  technique_seen: TechniqueCounts;
  technique_caught: TechniqueCounts;
  last_active: string;
};
const toStats = (r: StatsRow): UserStats => ({
  userId: r.user_id,
  xp: r.xp,
  totalAnswered: r.total_answered,
  totalCorrect: r.total_correct,
  falsePositives: r.false_positives,
  falseNegatives: r.false_negatives,
  bestStreak: r.best_streak,
  techniqueSeen: r.technique_seen ?? {},
  techniqueCaught: r.technique_caught ?? {},
  lastActive: r.last_active,
});
const fromStats = (s: UserStats): StatsRow => ({
  user_id: s.userId,
  xp: s.xp,
  total_answered: s.totalAnswered,
  total_correct: s.totalCorrect,
  false_positives: s.falsePositives,
  false_negatives: s.falseNegatives,
  best_streak: s.bestStreak,
  technique_seen: s.techniqueSeen,
  technique_caught: s.techniqueCaught,
  last_active: s.lastActive,
});

type RoundEventRow = {
  id: string;
  user_id: string;
  org_id: string | null;
  at: string;
  difficulty: string;
  total: number;
  correct: number;
  points: number;
  false_positives: number;
  false_negatives: number;
  technique_seen: TechniqueCounts;
  technique_caught: TechniqueCounts;
};
const toRoundEvent = (r: RoundEventRow): RoundEvent => ({
  id: r.id,
  userId: r.user_id,
  orgId: r.org_id,
  at: r.at,
  difficulty: r.difficulty,
  total: r.total,
  correct: r.correct,
  points: r.points,
  falsePositives: r.false_positives,
  falseNegatives: r.false_negatives,
  techniqueSeen: r.technique_seen ?? {},
  techniqueCaught: r.technique_caught ?? {},
});
const fromRoundEvent = (e: RoundEvent): RoundEventRow => ({
  id: e.id,
  user_id: e.userId,
  org_id: e.orgId,
  at: e.at,
  difficulty: e.difficulty,
  total: e.total,
  correct: e.correct,
  points: e.points,
  false_positives: e.falsePositives,
  false_negatives: e.falseNegatives,
  technique_seen: e.techniqueSeen,
  technique_caught: e.techniqueCaught,
});

type EmailRow = {
  id: string;
  org_id: string;
  author_id: string;
  version: number;
  published: boolean;
  created_at: string;
  updated_at: string;
  data: GameEmail;
};
const toEmail = (r: EmailRow): ServerEmail => ({
  ...(r.data as GameEmail),
  id: r.id,
  orgId: r.org_id,
  authorId: r.author_id,
  version: r.version,
  published: r.published,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const fromEmail = (e: ServerEmail): EmailRow => {
  const { orgId, authorId, version, published, createdAt, updatedAt, id, ...game } = e;
  return {
    id,
    org_id: orgId,
    author_id: authorId,
    version,
    published,
    created_at: createdAt,
    updated_at: updatedAt,
    data: { ...(game as unknown as GameEmail), id },
  };
};

type AssignmentRow = {
  id: string;
  org_id: string;
  created_by: string;
  title: string;
  difficulty: Assignment["difficulty"];
  focus_technique: Assignment["focusTechnique"];
  min_accuracy: number;
  min_rounds: number;
  team: string | null;
  due_date: string | null;
  created_at: string;
};
const toAssignment = (r: AssignmentRow): Assignment => ({
  id: r.id,
  orgId: r.org_id,
  createdBy: r.created_by,
  title: r.title,
  difficulty: r.difficulty,
  focusTechnique: r.focus_technique,
  minAccuracy: r.min_accuracy,
  minRounds: r.min_rounds,
  team: r.team,
  dueDate: r.due_date,
  createdAt: r.created_at,
});
const fromAssignment = (a: Assignment): AssignmentRow => ({
  id: a.id,
  org_id: a.orgId,
  created_by: a.createdBy,
  title: a.title,
  difficulty: a.difficulty,
  focus_technique: a.focusTechnique,
  min_accuracy: a.minAccuracy,
  min_rounds: a.minRounds,
  team: a.team,
  due_date: a.dueDate,
  created_at: a.createdAt,
});

type DuelRatingRow = { user_id: string; rating: number; wins: number; losses: number; draws: number };
const toDuelRating = (r: DuelRatingRow): DuelRating => ({
  userId: r.user_id,
  rating: r.rating,
  wins: r.wins,
  losses: r.losses,
  draws: r.draws,
});
const fromDuelRating = (r: DuelRating): DuelRatingRow => ({
  user_id: r.userId,
  rating: r.rating,
  wins: r.wins,
  losses: r.losses,
  draws: r.draws,
});

type AuditRow = { id: string; org_id: string; actor_id: string; action: string; detail: string; at: string };
const toAudit = (r: AuditRow): AuditEntry => ({
  id: r.id,
  orgId: r.org_id,
  actorId: r.actor_id,
  action: r.action,
  detail: r.detail,
  at: r.at,
});
const fromAudit = (a: AuditEntry): AuditRow => ({
  id: a.id,
  org_id: a.orgId,
  actor_id: a.actorId,
  action: a.action,
  detail: a.detail,
  at: a.at,
});

/** Throw with a bit of context so a failed query never fails silently. */
function must<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Supabase ${what} failed: ${res.error.message}`);
  return res.data;
}

class SupabaseRepository implements Repository {
  // users -----------------------------------------------------------------
  async getUser(id: string) {
    const { data, error } = await sb().from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Supabase getUser failed: ${error.message}`);
    return data ? toUser(data as ProfileRow) : null;
  }
  async getUserByEmail(email: string) {
    const { data, error } = await sb().from("profiles").select("*").ilike("email", email).maybeSingle();
    if (error) throw new Error(`Supabase getUserByEmail failed: ${error.message}`);
    return data ? toUser(data as ProfileRow) : null;
  }
  async getUserByHandle(handle: string) {
    const { data, error } = await sb().from("profiles").select("*").ilike("handle", handle).maybeSingle();
    if (error) throw new Error(`Supabase getUserByHandle failed: ${error.message}`);
    return data ? toUser(data as ProfileRow) : null;
  }
  async createUser(u: User) {
    must(await sb().from("profiles").insert(fromUser(u)), "createUser");
    return u;
  }
  async updateUser(id: string, patch: Partial<User>) {
    const row: Partial<ProfileRow> = {};
    if (patch.handle !== undefined) row.handle = patch.handle;
    if (patch.email !== undefined) row.email = patch.email;
    const { data, error } = await sb().from("profiles").update(row).eq("id", id).select("*").maybeSingle();
    if (error) throw new Error(`Supabase updateUser failed: ${error.message}`);
    return data ? toUser(data as ProfileRow) : null;
  }

  // magic tokens (unused under Supabase Auth) -----------------------------
  async createToken(_t: MagicToken): Promise<void> {
    throw new Error("Magic tokens are not used under Supabase Auth.");
  }
  async getToken(_token: string): Promise<MagicToken | null> {
    return null;
  }
  async markTokenUsed(_token: string): Promise<void> {
    /* no-op */
  }

  // stats -----------------------------------------------------------------
  async getStats(userId: string) {
    const { data, error } = await sb().from("stats").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw new Error(`Supabase getStats failed: ${error.message}`);
    return data ? toStats(data as StatsRow) : null;
  }
  async putStats(s: UserStats) {
    must(await sb().from("stats").upsert(fromStats(s), { onConflict: "user_id" }), "putStats");
  }
  async listStats(userIds?: string[]) {
    let q = sb().from("stats").select("*");
    if (userIds) q = q.in("user_id", userIds);
    const data = must(await q, "listStats") as StatsRow[];
    return data.map(toStats);
  }

  // round events ----------------------------------------------------------
  async addRoundEvent(e: RoundEvent) {
    must(await sb().from("round_events").insert(fromRoundEvent(e)), "addRoundEvent");
  }
  async listRoundEvents(filter: { orgId?: string | null; since?: string }) {
    let q = sb().from("round_events").select("*");
    if (filter.orgId !== undefined) q = filter.orgId === null ? q.is("org_id", null) : q.eq("org_id", filter.orgId);
    if (filter.since) q = q.gte("at", filter.since);
    const data = must(await q, "listRoundEvents") as RoundEventRow[];
    return data.map(toRoundEvent);
  }

  // orgs + memberships ----------------------------------------------------
  async createOrg(o: Org) {
    must(await sb().from("orgs").insert(fromOrg(o)), "createOrg");
    return o;
  }
  async getOrg(id: string) {
    const { data, error } = await sb().from("orgs").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Supabase getOrg failed: ${error.message}`);
    return data ? toOrg(data as OrgRow) : null;
  }
  async getOrgByJoinCode(code: string) {
    const { data, error } = await sb().from("orgs").select("*").ilike("join_code", code).maybeSingle();
    if (error) throw new Error(`Supabase getOrgByJoinCode failed: ${error.message}`);
    return data ? toOrg(data as OrgRow) : null;
  }
  async updateOrg(id: string, patch: Partial<Org>) {
    const row: Partial<OrgRow> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.settings !== undefined) row.settings = patch.settings;
    if (patch.plan !== undefined) row.plan = patch.plan;
    if (patch.joinCode !== undefined) row.join_code = patch.joinCode;
    const { data, error } = await sb().from("orgs").update(row).eq("id", id).select("*").maybeSingle();
    if (error) throw new Error(`Supabase updateOrg failed: ${error.message}`);
    return data ? toOrg(data as OrgRow) : null;
  }
  async addMembership(m: Membership) {
    must(await sb().from("memberships").upsert(fromMembership(m), { onConflict: "user_id,org_id" }), "addMembership");
  }
  async getMembership(userId: string, orgId: string) {
    const { data, error } = await sb()
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .eq("org_id", orgId)
      .maybeSingle();
    if (error) throw new Error(`Supabase getMembership failed: ${error.message}`);
    return data ? toMembership(data as MembershipRow) : null;
  }
  async listMemberships(filter: { userId?: string; orgId?: string }) {
    let q = sb().from("memberships").select("*");
    if (filter.userId) q = q.eq("user_id", filter.userId);
    if (filter.orgId) q = q.eq("org_id", filter.orgId);
    const data = must(await q, "listMemberships") as MembershipRow[];
    return data.map(toMembership);
  }

  // custom content --------------------------------------------------------
  async createEmail(e: ServerEmail) {
    must(await sb().from("emails").insert(fromEmail(e)), "createEmail");
    return e;
  }
  async getEmail(id: string) {
    const { data, error } = await sb().from("emails").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Supabase getEmail failed: ${error.message}`);
    return data ? toEmail(data as EmailRow) : null;
  }
  async updateEmail(id: string, patch: Partial<ServerEmail>) {
    const existing = await this.getEmail(id);
    if (!existing) return null;
    const merged = { ...existing, ...patch, id };
    must(await sb().from("emails").update(fromEmail(merged)).eq("id", id), "updateEmail");
    return merged;
  }
  async deleteEmail(id: string) {
    must(await sb().from("emails").delete().eq("id", id), "deleteEmail");
  }
  async listEmails(filter: { orgId: string; publishedOnly?: boolean }) {
    let q = sb().from("emails").select("*").eq("org_id", filter.orgId);
    if (filter.publishedOnly) q = q.eq("published", true);
    const data = must(await q.order("updated_at", { ascending: false }), "listEmails") as EmailRow[];
    return data.map(toEmail);
  }

  // assignments -----------------------------------------------------------
  async createAssignment(a: Assignment) {
    must(await sb().from("assignments").insert(fromAssignment(a)), "createAssignment");
    return a;
  }
  async getAssignment(id: string) {
    const { data, error } = await sb().from("assignments").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Supabase getAssignment failed: ${error.message}`);
    return data ? toAssignment(data as AssignmentRow) : null;
  }
  async listAssignments(orgId: string) {
    const data = must(
      await sb().from("assignments").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
      "listAssignments",
    ) as AssignmentRow[];
    return data.map(toAssignment);
  }
  async deleteAssignment(id: string) {
    must(await sb().from("assignments").delete().eq("id", id), "deleteAssignment");
  }

  // duel ratings ----------------------------------------------------------
  async getDuelRating(userId: string) {
    const { data, error } = await sb().from("duel_ratings").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw new Error(`Supabase getDuelRating failed: ${error.message}`);
    return data ? toDuelRating(data as DuelRatingRow) : null;
  }
  async putDuelRating(r: DuelRating) {
    must(await sb().from("duel_ratings").upsert(fromDuelRating(r), { onConflict: "user_id" }), "putDuelRating");
  }

  // audit -----------------------------------------------------------------
  async addAudit(a: AuditEntry) {
    must(await sb().from("audit").insert(fromAudit(a)), "addAudit");
  }
  async listAudit(orgId: string) {
    const data = must(
      await sb().from("audit").select("*").eq("org_id", orgId).order("at", { ascending: false }),
      "listAudit",
    ) as AuditRow[];
    return data.map(toAudit);
  }
}

export const supabaseRepository: Repository = new SupabaseRepository();
