"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, RefreshCw, Globe, Building2 } from "lucide-react";
import { useSession } from "@/net/session";
import { api, type LeaderboardResponse, type LeaderboardRow } from "@/net/api";

type Timeframe = "week" | "season" | "all";
const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "season", label: "This season" },
  { id: "all", label: "All-time" },
];

export function LeaderboardView() {
  const session = useSession();
  const [scope, setScope] = useState<"global" | "org">("global");
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState("");

  const orgId = session.activeOrgId ?? session.memberships[0]?.org.id ?? null;

  const load = useCallback(async () => {
    try {
      const res = await api.leaderboard(scope, timeframe, scope === "org" ? orgId ?? undefined : undefined);
      setData(res);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [scope, timeframe, orgId]);

  // Poll for live-ish updates (the SSE upgrade path is noted in the README).
  useEffect(() => {
    if (!session.backendAvailable) return;
    void load();
    const id = window.setInterval(load, 8000);
    return () => window.clearInterval(id);
  }, [load, session.backendAvailable]);

  if (!session.backendAvailable) {
    return <OfflineNote />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Inbox
        </Link>
        <h1 className="inline-flex items-center gap-2 text-lg font-semibold text-ink">
          <Trophy size={18} className="text-accent" /> Leaderboards
        </h1>
        <button onClick={load} aria-label="Refresh" className="rounded-full border border-border p-2 text-ink-muted hover:bg-[var(--row-hover)]">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Seg active={scope === "global"} onClick={() => setScope("global")} icon={<Globe size={14} />} label="Global" />
        {session.memberships.length > 0 && (
          <Seg active={scope === "org"} onClick={() => setScope("org")} icon={<Building2 size={14} />} label="My org" />
        )}
        <div className="mx-1 h-4 w-px bg-border" />
        {TIMEFRAMES.map((t) => (
          <Seg key={t.id} active={timeframe === t.id} onClick={() => setTimeframe(t.id)} label={t.label} />
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {data?.competitiveDisabled ? (
        <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-ink-muted">
          This organization has competitive features turned off.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="grid grid-cols-[3rem_1fr_5rem_5rem_5rem] gap-2 border-b border-border px-4 py-2 text-[11px] uppercase tracking-wide text-ink-faint">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Acc.</span>
            <span className="text-right">FP</span>
            <span className="text-right">Score</span>
          </div>
          {data && data.rows.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">
              No scores yet for this scope. Play a round to get on the board!
            </p>
          )}
          {data?.rows.map((r) => (
            <Row key={r.userId} r={r} />
          ))}

          {/* Always show my rank, even if off-screen. */}
          {data?.me && !data.rows.some((r) => r.isMe) && (
            <>
              <div className="border-t border-dashed border-border px-4 py-1 text-center text-[11px] text-ink-faint">
                your position
              </div>
              <Row r={data.me} />
            </>
          )}
        </div>
      )}

      <p className="mt-3 text-[11px] text-ink-faint">
        Ranked by points scaled by accuracy — careful play beats grinding easy emails. Accuracy and
        false-positive rate are shown so the signal stays honest.
      </p>
    </div>
  );
}

function Row({ r }: { r: LeaderboardRow }) {
  return (
    <div
      className={[
        "grid grid-cols-[3rem_1fr_5rem_5rem_5rem] items-center gap-2 border-b border-border px-4 py-2.5 text-sm",
        r.isMe ? "bg-accent-soft" : "",
      ].join(" ")}
    >
      <span className={["font-semibold", r.rank <= 3 ? "text-accent" : "text-ink-muted"].join(" ")}>{r.rank}</span>
      <span className="truncate text-ink">
        {r.name} {r.isMe && <span className="ml-1 rounded bg-accent px-1.5 py-0.5 text-[10px] text-[color:var(--accent-ink)]">you</span>}
      </span>
      <span className="text-right text-ink-muted">{Math.round(r.accuracy * 100)}%</span>
      <span className="text-right text-ink-faint">{Math.round(r.falsePositiveRate * 100)}%</span>
      <span className="text-right font-semibold text-ink">{r.rankScore.toLocaleString()}</span>
    </div>
  );
}

function Seg({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon?: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
        active ? "bg-accent text-[color:var(--accent-ink)]" : "border border-border text-ink-muted hover:bg-[var(--row-hover)]",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

function OfflineNote() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <Trophy size={28} className="mx-auto mb-3 text-ink-faint" />
      <h1 className="mb-2 text-lg font-semibold text-ink">Leaderboards are an online feature</h1>
      <p className="text-sm text-ink-muted">
        This build is running frontend-only. Enable the backend (see the README) to compete on
        global, org, and team leaderboards. Solo play, the daily challenge, and duels work offline.
      </p>
      <Link href="/" className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)]">
        Back to inbox
      </Link>
    </div>
  );
}
