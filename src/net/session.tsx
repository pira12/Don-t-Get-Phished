"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type ApiMembership, type ApiOrg, type ApiUser } from "./api";
import { loadStats, saveStats, type LifetimeStats } from "@/game/storage";
import type { RedFlagType } from "@/game/types";
import type { RoundSubmission } from "@/server/types";

type Status = "loading" | "guest" | "authed";

type OrgMembership = { membership: ApiMembership; org: ApiOrg };

type SessionValue = {
  status: Status;
  backendAvailable: boolean;
  user: ApiUser | null;
  memberships: OrgMembership[];
  activeOrgId: string | null;
  setActiveOrgId: (id: string | null) => void;
  refresh: () => Promise<void>;
  requestLink: (email: string) => Promise<{ devToken?: string; emailSent: boolean }>;
  verify: (token: string, handle?: string) => Promise<void>;
  logout: () => Promise<void>;
  submitRound: (r: RoundSubmission) => void;
};

const SessionContext = createContext<SessionValue | null>(null);

/** Server stat mirror -> keep only the monotonic counters we sync. */
function localToServerStats(s: LifetimeStats) {
  return {
    xp: s.xp,
    totalAnswered: s.totalAnswered,
    totalCorrect: s.totalCorrect,
    falsePositives: s.falsePositives,
    falseNegatives: s.falseNegatives,
    bestStreak: s.bestStreak,
    techniqueSeen: s.techniqueSeen,
    techniqueCaught: s.techniqueCaught,
  };
}

/** Two-way max-merge: fold the server's cumulative counters into local storage. */
function mergeServerIntoLocal(server: Record<string, unknown>) {
  const local = loadStats();
  const num = (k: string) => Math.max((local as never)[k] ?? 0, Number(server[k] ?? 0) || 0);
  const mergeMap = (a: Partial<Record<RedFlagType, number>>, b: Record<string, unknown>) => {
    const out = { ...a } as Partial<Record<RedFlagType, number>>;
    for (const [k, v] of Object.entries(b || {})) {
      out[k as RedFlagType] = Math.max(out[k as RedFlagType] ?? 0, Number(v) || 0);
    }
    return out;
  };
  const merged: LifetimeStats = {
    ...local,
    xp: num("xp"),
    totalAnswered: num("totalAnswered"),
    totalCorrect: num("totalCorrect"),
    falsePositives: num("falsePositives"),
    falseNegatives: num("falseNegatives"),
    bestStreak: num("bestStreak"),
    techniqueSeen: mergeMap(local.techniqueSeen, (server.techniqueSeen as Record<string, unknown>) || {}),
    techniqueCaught: mergeMap(local.techniqueCaught, (server.techniqueCaught as Record<string, unknown>) || {}),
  };
  saveStats(merged);
  return merged;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setBackendAvailable(true);
      setUser(me.user);
      setMemberships(me.memberships);
      setStatus(me.user ? "authed" : "guest");
      if (me.user && me.memberships[0] && !activeOrgId) {
        setActiveOrgId(me.memberships[0].org.id);
      }
    } catch {
      // No backend (static build / frontend-only host) — stay a happy guest.
      setBackendAvailable(false);
      setStatus("guest");
    }
  }, [activeOrgId]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLink = useCallback(async (email: string) => {
    const r = await api.requestLink(email);
    return { devToken: r.devToken, emailSent: r.emailSent };
  }, []);

  const verify = useCallback(async (token: string, handle?: string) => {
    const { user: u } = await api.verify(token, handle);
    setUser(u);
    setStatus("authed");
    // Adopt guest progress: push local up, pull server down, both max-merged.
    try {
      const pushed = await api.syncStats(localToServerStats(loadStats()));
      mergeServerIntoLocal(pushed.stats);
    } catch {
      /* best-effort */
    }
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setUser(null);
    setMemberships([]);
    setActiveOrgId(null);
    setStatus("guest");
  }, []);

  /** Fire-and-forget round submission + cumulative stat sync (offline-first). */
  const submitRound = useCallback(
    (r: RoundSubmission) => {
      if (status !== "authed") return;
      void api.submitRound({ ...r, orgId: activeOrgId }).catch(() => {});
      void api
        .syncStats(localToServerStats(loadStats()))
        .then((res) => mergeServerIntoLocal(res.stats))
        .catch(() => {});
    },
    [status, activeOrgId],
  );

  const value: SessionValue = {
    status,
    backendAvailable,
    user,
    memberships,
    activeOrgId,
    setActiveOrgId,
    refresh,
    requestLink,
    verify,
    logout,
    submitRound,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
