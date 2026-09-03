import { displayName, json } from "@/server/http";
import { currentUser } from "@/server/auth";
import { db } from "@/server/db";
import {
  buildAllTimeLeaderboard,
  buildLeaderboard,
  sinceForTimeframe,
  type LeaderboardRow,
  type Timeframe,
} from "@/server/leaderboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOP_N = 50;

/**
 * GET /api/leaderboard?scope=global|org&orgId=&timeframe=week|season|all
 * Returns the top rows plus the current user's own row (even if off-screen).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") === "org" ? "org" : "global";
  const timeframe = (["week", "season", "all"].includes(url.searchParams.get("timeframe") || "")
    ? url.searchParams.get("timeframe")
    : "week") as Timeframe;
  const orgId = url.searchParams.get("orgId");

  const me = await currentUser();
  const org = scope === "org" && orgId ? await db.getOrg(orgId) : null;
  if (scope === "org" && !org) return json({ error: "Unknown org" }, 404);
  if (scope === "org" && !org!.settings.competitiveEnabled) {
    return json({ rows: [], me: null, competitiveDisabled: true });
  }

  // Restrict to org members when scoped to an org.
  let memberIds: Set<string> | null = null;
  if (scope === "org" && org) {
    const memberships = await db.listMemberships({ orgId: org.id });
    memberIds = new Set(memberships.map((m) => m.userId));
  }

  let rows: LeaderboardRow[];
  if (timeframe === "all") {
    const stats = await db.listStats(memberIds ? [...memberIds] : undefined);
    rows = buildAllTimeLeaderboard(stats);
  } else {
    const since = sinceForTimeframe(timeframe);
    let events = await db.listRoundEvents(scope === "org" ? { orgId, since } : { since });
    if (scope === "global") events = events; // global pool includes everyone
    rows = buildLeaderboard(events);
  }

  // Resolve display names (honouring org privacy) for the visible slice + me.
  const visible = rows.slice(0, TOP_N);
  const myRow = me ? rows.find((r) => r.userId === me.id) ?? null : null;
  const idsToName = new Set<string>([...visible.map((r) => r.userId)]);
  if (myRow) idsToName.add(myRow.userId);

  const nameById = new Map<string, string>();
  await Promise.all(
    [...idsToName].map(async (id) => {
      const u = await db.getUser(id);
      nameById.set(id, displayName(u, org));
    }),
  );

  const decorate = (r: LeaderboardRow) => ({
    ...r,
    name: nameById.get(r.userId) ?? "Player",
    isMe: me?.id === r.userId,
  });

  return json({
    scope,
    timeframe,
    rows: visible.map(decorate),
    me: myRow ? decorate(myRow) : null,
    total: rows.length,
  });
}
