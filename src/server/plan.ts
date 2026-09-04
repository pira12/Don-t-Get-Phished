/**
 * Plan-based feature gating for the hosted SaaS.
 *
 * Individuals play entirely for free with no org. Orgs get a tier:
 *  - free:       small teams — core admin dashboard, join code, basic content.
 *  - team:       larger teams — assignments, custom content library, reports.
 *  - enterprise: everything, plus higher limits and the customization/options we
 *                sell to enterprises (SSO, branding, API — wired incrementally).
 *
 * Keep this the single source of truth so routes and UI gate consistently. Limits
 * that read `Infinity` are "no cap on this tier".
 */

import type { OrgPlan } from "./types";

export type Feature =
  | "customContent" // author/import scenario emails
  | "assignments" // assign training to teams/individuals
  | "reports" // compliance CSV/JSON exports
  | "sso" // SAML/OIDC single sign-on
  | "branding" // custom logo/colors on the org's tenant
  | "api"; // programmatic access

export type PlanCaps = {
  features: Record<Feature, boolean>;
  /** Max seats (members) the org may have. */
  maxSeats: number;
  /** Max org-authored scenario emails. */
  maxCustomEmails: number;
};

const FREE: PlanCaps = {
  features: { customContent: true, assignments: false, reports: false, sso: false, branding: false, api: false },
  maxSeats: 10,
  maxCustomEmails: 10,
};

const TEAM: PlanCaps = {
  features: { customContent: true, assignments: true, reports: true, sso: false, branding: false, api: false },
  maxSeats: 200,
  maxCustomEmails: 500,
};

const ENTERPRISE: PlanCaps = {
  features: { customContent: true, assignments: true, reports: true, sso: true, branding: true, api: true },
  maxSeats: Infinity,
  maxCustomEmails: Infinity,
};

const CAPS: Record<OrgPlan, PlanCaps> = { free: FREE, team: TEAM, enterprise: ENTERPRISE };

export function capsFor(plan: OrgPlan | undefined | null): PlanCaps {
  return CAPS[plan ?? "free"] ?? FREE;
}

export function planAllows(plan: OrgPlan | undefined | null, feature: Feature): boolean {
  return capsFor(plan).features[feature];
}
