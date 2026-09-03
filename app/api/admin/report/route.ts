import { NextResponse } from "next/server";
import { json } from "@/server/http";
import { requireOrgAdmin } from "@/server/guard";
import { db } from "@/server/db";
import { displayName } from "@/server/http";
import {
  buildAssignmentsReport,
  buildAuditReport,
  buildMembersReport,
  buildTechniqueReport,
  toCsv,
  type Table,
} from "@/server/reports";
import type { RoundEvent, UserStats } from "@/server/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReportType = "members" | "assignments" | "techniques" | "audit";
const TYPES = new Set<ReportType>(["members", "assignments", "techniques", "audit"]);

/**
 * GET /api/admin/report?orgId=&type=members|assignments|techniques|audit&format=csv|json
 * Admin-gated. CSV downloads for audits; JSON backs the printable summary.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orgId = url.searchParams.get("orgId");
  const type = (url.searchParams.get("type") || "members") as ReportType;
  const format = url.searchParams.get("format") === "json" ? "json" : "csv";

  const guard = await requireOrgAdmin(orgId);
  if (!guard.ok) return guard.response;
  if (!TYPES.has(type)) return json({ error: "Unknown report type" }, 400);

  const org = guard.org;
  const memberships = await db.listMemberships({ orgId: org.id });
  const events = await db.listRoundEvents({ orgId: org.id });

  const eventsByUser = new Map<string, RoundEvent[]>();
  for (const e of events) {
    const arr = eventsByUser.get(e.userId) ?? [];
    arr.push(e);
    eventsByUser.set(e.userId, arr);
  }

  // Resolve display names honouring org privacy.
  const nameById = new Map<string, string>();
  await Promise.all(
    memberships.map(async (m) => {
      const u = await db.getUser(m.userId);
      nameById.set(m.userId, displayName(u, org));
    }),
  );

  let table: Table;
  if (type === "members") {
    const stats = await db.listStats(memberships.map((m) => m.userId));
    const statsById = new Map<string, UserStats>(stats.map((s) => [s.userId, s]));
    table = buildMembersReport(org, memberships, statsById, nameById, eventsByUser);
  } else if (type === "assignments") {
    const assignments = await db.listAssignments(org.id);
    table = buildAssignmentsReport(assignments, memberships, nameById, eventsByUser);
  } else if (type === "techniques") {
    table = buildTechniqueReport(events);
  } else {
    const audit = await db.listAudit(org.id);
    // audit actors may not be current members — resolve any missing names.
    await Promise.all(
      audit.map(async (a) => {
        if (!nameById.has(a.actorId)) {
          const u = await db.getUser(a.actorId);
          nameById.set(a.actorId, displayName(u, org));
        }
      }),
    );
    table = buildAuditReport(audit, nameById);
  }

  if (format === "json") {
    return json({ org: { name: org.name }, type, generatedAt: new Date().toISOString(), table });
  }

  const csv = toCsv(table);
  const filename = `${slug(org.name)}-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "org";
}
