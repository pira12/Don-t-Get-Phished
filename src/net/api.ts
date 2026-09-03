"use client";

/**
 * Thin client for the optional backend. The game is offline-first: if the backend
 * isn't reachable (e.g. the static-export build, or a self-host that only runs the
 * frontend), every call fails soft and the online UI hides itself. Nothing here is
 * on the critical path for playing.
 */

export type ApiUser = { id: string; handle: string; email: string | null; createdAt: string };
export type ApiMembership = { userId: string; orgId: string; role: "player" | "org_admin"; team: string | null; joinedAt: string };
export type ApiOrg = { id: string; name: string; joinCode: string; settings: { leaderboardDisplay: string; competitiveEnabled: boolean } };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  me: () => call<{ user: ApiUser | null; memberships: { membership: ApiMembership; org: ApiOrg }[] }>("/auth/me"),
  requestLink: (email: string) =>
    call<{ ok: boolean; emailSent: boolean; devToken?: string }>("/auth/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verify: (token: string, handle?: string) =>
    call<{ user: ApiUser }>("/auth/verify", { method: "POST", body: JSON.stringify({ token, handle }) }),
  logout: () => call<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  getStats: () => call<{ stats: Record<string, unknown> }>("/sync"),
  syncStats: (stats: unknown) => call<{ stats: Record<string, unknown> }>("/sync", { method: "POST", body: JSON.stringify(stats) }),
  submitRound: (round: unknown) => call<{ ok: boolean }>("/rounds", { method: "POST", body: JSON.stringify(round) }),

  leaderboard: (scope: "global" | "org", timeframe: "week" | "season" | "all", orgId?: string) =>
    call<LeaderboardResponse>(
      `/leaderboard?scope=${scope}&timeframe=${timeframe}${orgId ? `&orgId=${orgId}` : ""}`,
    ),

  createOrg: (name: string) => call<{ org: ApiOrg; membership: ApiMembership }>("/orgs", { method: "POST", body: JSON.stringify({ name }) }),
  joinOrg: (code: string, team?: string) =>
    call<{ org: ApiOrg; membership: ApiMembership }>("/orgs/join", { method: "POST", body: JSON.stringify({ code, team }) }),

  adminOverview: (orgId: string) => call<AdminOverviewResponse>(`/admin/overview?orgId=${orgId}`),
};

export type LeaderboardRow = {
  userId: string;
  name: string;
  isMe: boolean;
  rank: number;
  rankScore: number;
  points: number;
  answered: number;
  correct: number;
  accuracy: number;
  falsePositiveRate: number;
};
export type LeaderboardResponse = {
  scope: string;
  timeframe: string;
  rows: LeaderboardRow[];
  me: LeaderboardRow | null;
  total: number;
  competitiveDisabled?: boolean;
};

export type AdminOverviewResponse = {
  org: { id: string; name: string; joinCode: string; settings: { leaderboardDisplay: string; competitiveEnabled: boolean } };
  overview: { activeUsers: number; totalRounds: number; avgAccuracy: number; participationByDay: { date: string; rounds: number }[] };
  heatmap: { technique: string; seen: number; caught: number; missRate: number }[];
  members: {
    userId: string;
    name: string;
    role: string;
    team: string | null;
    joinedAt: string;
    lastActive: string | null;
    accuracy: number;
    answered: number;
    falseNegatives: number;
    falsePositives: number;
    recentRounds: number;
    atRisk: boolean;
  }[];
  audit: { id: string; action: string; detail: string; at: string }[];
};
