/**
 * Pure compliance-report builders + CSV serialisation. No IO — unit-tested and
 * reused by the export API. Produces audit-ready CSVs (completion, scores, time,
 * technique coverage) plus an immutable audit trail.
 */

import { TECHNIQUE_LABELS, type RedFlagType } from "@/game/types";
import { computeAssignmentProgress, assignmentAppliesTo } from "./assignments";
import type { Assignment, Membership, Org, RoundEvent, UserStats } from "./types";

export type Table = { headers: string[]; rows: (string | number)[][] };

/** RFC-4180-ish CSV: quote fields containing quotes, commas or newlines. */
export function toCsv(table: Table): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [table.headers, ...table.rows].map((row) => row.map(esc).join(","));
  return lines.join("\r\n") + "\r\n";
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Per-member training status: accuracy, FP/FN, activity, risk. */
export function buildMembersReport(
  org: Org,
  memberships: Membership[],
  statsById: Map<string, UserStats>,
  nameById: Map<string, string>,
  eventsByUser: Map<string, RoundEvent[]>,
): Table {
  const headers = [
    "Member",
    "Role",
    "Team",
    "Joined",
    "Last active",
    "Emails judged",
    "Accuracy",
    "Missed phishing",
    "Over-flagged",
    "Rounds (org)",
    "Status",
  ];
  const rows = memberships
    .map((m) => {
      const s = statsById.get(m.userId);
      const answered = s?.totalAnswered ?? 0;
      const accuracy = answered ? s!.totalCorrect / answered : 0;
      const atRisk = answered >= 10 && accuracy < 0.6;
      return {
        sort: accuracy,
        row: [
          nameById.get(m.userId) ?? "Player",
          m.role,
          m.team ?? "",
          m.joinedAt.slice(0, 10),
          s?.lastActive ? s.lastActive.slice(0, 10) : "",
          answered,
          answered ? pct(accuracy) : "",
          s?.falseNegatives ?? 0,
          s?.falsePositives ?? 0,
          (eventsByUser.get(m.userId) ?? []).length,
          answered ? (atRisk ? "Needs practice" : "On track") : "No data",
        ] as (string | number)[],
      };
    })
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.row);

  return { headers, rows };
}

/** Per-assignment completion, one row per (assignment × assigned member). */
export function buildAssignmentsReport(
  assignments: Assignment[],
  memberships: Membership[],
  nameById: Map<string, string>,
  eventsByUser: Map<string, RoundEvent[]>,
): Table {
  const headers = [
    "Assignment",
    "Difficulty",
    "Focus technique",
    "Target accuracy",
    "Required rounds",
    "Due",
    "Member",
    "Team",
    "Qualifying rounds",
    "Best accuracy",
    "Completed",
  ];
  const rows: (string | number)[][] = [];
  for (const a of assignments) {
    const focus = a.focusTechnique ? TECHNIQUE_LABELS[a.focusTechnique] : "Any";
    for (const m of memberships.filter((x) => assignmentAppliesTo(a, x.team))) {
      const prog = computeAssignmentProgress(a, eventsByUser.get(m.userId) ?? []);
      rows.push([
        a.title,
        a.difficulty,
        focus,
        pct(a.minAccuracy),
        a.minRounds,
        a.dueDate ? a.dueDate.slice(0, 10) : "",
        nameById.get(m.userId) ?? "Player",
        m.team ?? "",
        prog.qualifyingRounds,
        pct(prog.bestAccuracy),
        prog.complete ? "Yes" : "No",
      ]);
    }
  }
  return { headers, rows };
}

/** Org-wide technique coverage (how much the workforce misses each technique). */
export function buildTechniqueReport(events: RoundEvent[]): Table {
  const seen: Partial<Record<RedFlagType, number>> = {};
  const caught: Partial<Record<RedFlagType, number>> = {};
  for (const e of events) {
    for (const [k, v] of Object.entries(e.techniqueSeen)) seen[k as RedFlagType] = (seen[k as RedFlagType] ?? 0) + (v ?? 0);
    for (const [k, v] of Object.entries(e.techniqueCaught)) caught[k as RedFlagType] = (caught[k as RedFlagType] ?? 0) + (v ?? 0);
  }
  const rows = (Object.keys(seen) as RedFlagType[])
    .map((t) => {
      const s = seen[t] ?? 0;
      const c = caught[t] ?? 0;
      return [TECHNIQUE_LABELS[t], s, c, pct(s ? c / s : 0), pct(s ? 1 - c / s : 0)] as (string | number)[];
    })
    .sort((a, b) => Number(String(b[4]).replace("%", "")) - Number(String(a[4]).replace("%", "")));
  return { headers: ["Technique", "Seen", "Caught", "Catch rate", "Miss rate"], rows };
}

export function buildAuditReport(entries: { at: string; action: string; detail: string; actorId: string }[], nameById: Map<string, string>): Table {
  return {
    headers: ["Timestamp", "Action", "Detail", "Actor"],
    rows: entries.map((e) => [e.at, e.action, e.detail, nameById.get(e.actorId) ?? e.actorId]),
  };
}
