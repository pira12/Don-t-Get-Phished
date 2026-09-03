import { currentUser } from "./auth";
import { db } from "./db";
import { forbidden, notFound, unauthorized } from "./http";
import type { Org, User } from "./types";

export type GuardOk = { ok: true; user: User; org: Org };
export type GuardFail = { ok: false; response: Response };

/** Require the caller to be an org_admin of `orgId`. */
export async function requireOrgAdmin(orgId: string | null): Promise<GuardOk | GuardFail> {
  const user = await currentUser();
  if (!user) return { ok: false, response: unauthorized() };
  if (!orgId) return { ok: false, response: notFound() };
  const org = await db.getOrg(orgId);
  if (!org) return { ok: false, response: notFound() };
  const membership = await db.getMembership(user.id, orgId);
  if (!membership || membership.role !== "org_admin") return { ok: false, response: forbidden() };
  return { ok: true, user, org };
}

/** Require the caller to simply be a member of `orgId`. */
export async function requireMember(orgId: string | null): Promise<GuardOk | GuardFail> {
  const user = await currentUser();
  if (!user) return { ok: false, response: unauthorized() };
  if (!orgId) return { ok: false, response: notFound() };
  const org = await db.getOrg(orgId);
  if (!org) return { ok: false, response: notFound() };
  const membership = await db.getMembership(user.id, orgId);
  if (!membership) return { ok: false, response: forbidden() };
  return { ok: true, user, org };
}
