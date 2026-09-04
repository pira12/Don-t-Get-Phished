"use client";

/**
 * Thin client for the backend. The game is offline-first: if the backend isn't
 * reachable, every call fails soft and the online UI hides itself. Nothing here is
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
  verify: (token: string, handle?: string, email?: string) =>
    call<{ user: ApiUser }>("/auth/verify", { method: "POST", body: JSON.stringify({ token, handle, email }) }),
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

  // custom content
  listContent: (orgId: string) => call<{ emails: ServerEmailDto[] }>(`/admin/content?orgId=${orgId}`),
  createContent: (orgId: string, email: unknown) =>
    call<{ email: ServerEmailDto }>("/admin/content", { method: "POST", body: JSON.stringify({ ...(email as object), orgId }) }),
  updateContent: (id: string, patch: unknown) =>
    call<{ email: ServerEmailDto }>(`/admin/content/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteContent: (id: string) => call<{ ok: boolean }>(`/admin/content/${id}`, { method: "DELETE" }),
  importContent: (orgId: string, raw: string) =>
    call<{ draft: ImportedDraft }>("/admin/content/import", { method: "POST", body: JSON.stringify({ orgId, raw }) }),
  memberContent: (orgId: string) => call<{ emails: ServerEmailDto[] }>(`/content?orgId=${orgId}`),

  // assignments
  listAssignments: (orgId: string) => call<{ assignments: AdminAssignment[] }>(`/admin/assignments?orgId=${orgId}`),
  createAssignment: (orgId: string, a: unknown) =>
    call<{ assignment: AdminAssignment }>("/admin/assignments", { method: "POST", body: JSON.stringify({ ...(a as object), orgId }) }),
  deleteAssignment: (id: string) => call<{ ok: boolean }>(`/admin/assignments/${id}`, { method: "DELETE" }),
  myAssignments: (orgId: string) => call<{ assignments: MyAssignment[] }>(`/assignments?orgId=${orgId}`),

  // online duels (real-time matchmaking)
  duelQueue: (size: number, difficulty: string) =>
    call<DuelQueueResponse>("/duel/queue", { method: "POST", body: JSON.stringify({ size, difficulty }) }),
  duelCancel: (matchId: string) => call<{ ok: boolean }>(`/duel/queue?matchId=${matchId}`, { method: "DELETE" }),
  duelMatch: (matchId: string) => call<DuelMatchView>(`/duel/match/${matchId}`),
  duelAnswer: (matchId: string, correct: boolean, elapsedMs: number) =>
    call<DuelMatchView>(`/duel/match/${matchId}/answer`, { method: "POST", body: JSON.stringify({ correct, elapsedMs }) }),
  duelForfeit: (matchId: string) => call<DuelMatchView>(`/duel/match/${matchId}/forfeit`, { method: "POST" }),

  // compliance reports
  reportCsvUrl: (orgId: string, type: ReportType) => `/api/admin/report?orgId=${orgId}&type=${type}&format=csv`,
  reportJson: (orgId: string, type: ReportType) =>
    call<{ org: { name: string }; type: string; generatedAt: string; table: ReportTable }>(
      `/admin/report?orgId=${orgId}&type=${type}&format=json`,
    ),
};

export type ReportType = "members" | "assignments" | "techniques" | "audit";
export type ReportTable = { headers: string[]; rows: (string | number)[][] };

export type DuelQueueResponse = {
  matchId: string;
  role: 1 | 2;
  status: "waiting" | "active" | "finished";
  seed: number;
  size: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  rating: number;
};

export type DuelMatchView = {
  matchId: string;
  status: "waiting" | "active" | "finished";
  seed: number;
  size: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  you: { score: number; index: number; finished: boolean };
  opponent: { name: string; score: number; index: number; finished: boolean } | null;
  bothFinished: boolean;
  winnerId?: string | null;
  youWon?: boolean | null;
  ratingAfter?: number;
  ratingDelta?: number;
};

/** ServerEmail as returned to the client — the GameEmail shape plus meta. */
export type ServerEmailDto = {
  id: string;
  orgId: string;
  version: number;
  published: boolean;
  truth: "phishing" | "legit";
  difficulty: "easy" | "medium" | "hard";
  from: { name: string; address: string };
  replyTo?: string;
  to: string;
  subject: string;
  timestamp: string;
  snippet: string;
  bodyHtml: string;
  links: { text: string; href: string }[];
  attachments?: { name: string; sizeKB: number; suspicious?: boolean; reason?: string }[];
  auth: { spf: string; dkim: string; dmarc: string };
  firstTimeSender?: boolean;
  mailedBy?: string;
  signedBy?: string;
  redFlags: { type: string; anchor: string; explanation: string }[];
  legitSignals?: string[];
  techniqueTags?: string[];
  updatedAt: string;
};

export type ImportedDraft = {
  truth: "phishing" | "legit";
  difficulty: "easy" | "medium" | "hard";
  from: { name: string; address: string };
  replyTo?: string;
  to: string;
  subject: string;
  snippet?: string;
  bodyHtml: string;
  links: { text: string; href: string }[];
  auth: { spf: string; dkim: string; dmarc: string };
  firstTimeSender?: boolean;
  mailedBy?: string;
  redFlags: { type: string; anchor: string; explanation: string }[];
};

export type AdminAssignment = {
  id: string;
  title: string;
  difficulty: string;
  focusTechnique: string | null;
  minAccuracy: number;
  minRounds: number;
  team: string | null;
  dueDate: string | null;
  createdAt: string;
  assignedCount: number;
  completedCount: number;
};

export type MyAssignment = {
  assignment: {
    id: string;
    title: string;
    difficulty: string;
    focusTechnique: string | null;
    minAccuracy: number;
    minRounds: number;
    dueDate: string | null;
  };
  progress: { qualifyingRounds: number; complete: boolean; bestAccuracy: number };
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
