import { displayName, forbidden, json, notFound, unauthorized } from "@/server/http";
import { currentUser } from "@/server/auth";
import { db } from "@/server/db";
import { orgOverview, weaknessHeatmap } from "@/server/leaderboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/overview?orgId= — gated by org_admin. Returns the org overview,
 * the weakness heatmap (where real-world risk sits), and a per-member drill-down
 * framed as "who needs more practice", never public shaming.
 */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const orgId = new URL(req.url).searchParams.get("orgId");
  if (!orgId) return json({ error: "Missing orgId" }, 400);

  const org = await db.getOrg(orgId);
  if (!org) return notFound();

  const membership = await db.getMembership(user.id, orgId);
  if (!membership || membership.role !== "org_admin") return forbidden();

  const memberships = await db.listMemberships({ orgId });
  const events = await db.listRoundEvents({ orgId });

  const overview = orgOverview(events);
  const heatmap = weaknessHeatmap(events);

  // Per-member drill-down from the stat mirrors + org events.
  const memberIds = memberships.map((m) => m.userId);
  const stats = await db.listStats(memberIds);
  const statById = new Map(stats.map((s) => [s.userId, s]));
  const eventsByUser = new Map<string, { rounds: number; correct: number; answered: number; fp: number }>();
  for (const e of events) {
    const a = eventsByUser.get(e.userId) ?? { rounds: 0, correct: 0, answered: 0, fp: 0 };
    a.rounds += 1;
    a.correct += e.correct;
    a.answered += e.total;
    a.fp += e.falsePositives;
    eventsByUser.set(e.userId, a);
  }

  const members = await Promise.all(
    memberships.map(async (m) => {
      const u = await db.getUser(m.userId);
      const s = statById.get(m.userId);
      const ev = eventsByUser.get(m.userId);
      const answered = s?.totalAnswered ?? 0;
      return {
        userId: m.userId,
        name: displayName(u, org),
        role: m.role,
        team: m.team,
        joinedAt: m.joinedAt,
        lastActive: s?.lastActive ?? null,
        accuracy: answered ? (s!.totalCorrect / answered) : 0,
        answered,
        falseNegatives: s?.falseNegatives ?? 0,
        falsePositives: s?.falsePositives ?? 0,
        recentRounds: ev?.rounds ?? 0,
        // "at risk" = consistently fooled, framed constructively for more practice.
        atRisk: answered >= 10 && (s!.totalCorrect / answered) < 0.6,
      };
    }),
  );
  members.sort((a, b) => a.accuracy - b.accuracy);

  const audit = await db.listAudit(orgId);

  return json({
    org: { id: org.id, name: org.name, joinCode: org.joinCode, settings: org.settings },
    overview,
    heatmap,
    members,
    audit: audit.slice(0, 30),
  });
}
