"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Target, Flame, AlertTriangle, Lock } from "lucide-react";
import { loadStats, EMPTY_STATS, type LifetimeStats } from "@/game/storage";
import { levelForXp, tierForLevel } from "@/game/xp";
import { BADGES, type PlayerProfile } from "@/game/badges";
import { TECHNIQUE_LABELS, type RedFlagType } from "@/game/types";

export function StatsView() {
  const [stats, setStats] = useState<LifetimeStats>(EMPTY_STATS);
  useEffect(() => setStats(loadStats()), []);

  const level = levelForXp(stats.xp);
  const tier = tierForLevel(level.level);
  const accuracy =
    stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;

  const profile: PlayerProfile = {
    totalAnswered: stats.totalAnswered,
    totalCorrect: stats.totalCorrect,
    bestStreak: stats.bestStreak,
    falsePositives: stats.falsePositives,
    techniqueCaught: stats.techniqueCaught,
    fastestReplyToCatchMs: stats.fastestReplyToCatchMs,
    cleanRunNoFalsePositive: stats.cleanRunNoFalsePositive,
    perfectHeaderRounds: stats.perfectHeaderRounds,
    dailyStreak: stats.dailyStreak,
  };

  const techniques = (Object.keys(TECHNIQUE_LABELS) as RedFlagType[])
    .map((t) => ({
      t,
      seen: stats.techniqueSeen[t] ?? 0,
      caught: stats.techniqueCaught[t] ?? 0,
    }))
    .filter((r) => r.seen > 0)
    .sort((a, b) => a.caught / a.seen - b.caught / b.seen);

  const totalWrong = stats.falsePositives + stats.falseNegatives;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Back to inbox
        </Link>
        <h1 className="text-lg font-semibold text-ink">Your stats</h1>
      </div>

      {stats.totalAnswered === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-ink-muted">
          No games yet — head back to the inbox and judge a few emails to see your stats here.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card icon={<Target size={16} />} label="Lifetime accuracy" value={`${accuracy}%`} />
            <Card icon={<Flame size={16} />} label="Best streak" value={String(stats.bestStreak)} />
            <Card icon={<Trophy size={16} />} label="Tier" value={tier.name} color={tier.color} />
            <Card icon={<Trophy size={16} />} label="Level" value={String(level.level)} />
          </div>

          {/* FP vs FN */}
          <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-1 text-sm font-semibold text-ink">Where your mistakes fall</h2>
            <p className="mb-4 text-xs text-ink-muted">
              Missing phishing (false negatives) is dangerous; over-flagging safe mail (false
              positives) erodes trust. Good analysts keep both low.
            </p>
            {totalWrong === 0 ? (
              <p className="text-sm text-success">No mistakes yet — flawless.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <Bar
                  label="Missed phishing (false negatives)"
                  value={stats.falseNegatives}
                  total={totalWrong}
                  color="var(--danger)"
                />
                <Bar
                  label="Over-flagged safe mail (false positives)"
                  value={stats.falsePositives}
                  total={totalWrong}
                  color="var(--warning)"
                />
              </div>
            )}
          </section>

          {/* Technique heatmap */}
          {techniques.length > 0 && (
            <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
              <h2 className="mb-4 text-sm font-semibold text-ink">Technique-by-technique performance</h2>
              <ul className="flex flex-col gap-2.5">
                {techniques.map(({ t, seen, caught }) => {
                  const pct = Math.round((caught / seen) * 100);
                  return (
                    <li key={t} className="flex items-center gap-3">
                      <span className="w-52 shrink-0 truncate text-xs text-ink-muted">
                        {TECHNIQUE_LABELS[t]}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)",
                          }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right text-xs font-medium text-ink">
                        {pct}%
                      </span>
                    </li>
                  );
                })}
              </ul>
              {techniques[0] && techniques[0].caught / techniques[0].seen < 0.6 && (
                <p className="mt-3 flex items-center gap-2 text-xs text-[color:var(--warning)]">
                  <AlertTriangle size={14} /> Weakest area: {TECHNIQUE_LABELS[techniques[0].t]}. Try
                  “Train my weak spots” after a round.
                </p>
              )}
            </section>
          )}

          {/* Badges */}
          <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-1 text-sm font-semibold text-ink">Achievements</h2>
            <p className="mb-4 text-xs text-ink-muted">
              Each badge names a real skill — the gallery doubles as a learning checklist.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BADGES.map((b) => {
                const p = Math.round(b.progress(profile) * 100);
                const earned = p >= 100;
                return (
                  <div
                    key={b.id}
                    className={[
                      "rounded-client border p-3",
                      earned ? "border-success/40 bg-success-soft" : "border-border bg-surface-2",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">{b.name}</span>
                      {earned ? (
                        <Trophy size={15} className="text-success" />
                      ) : (
                        <Lock size={14} className="text-ink-faint" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-ink-muted">{b.skill}</p>
                    {!earned && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${p}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Card({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 text-ink-faint">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 text-xl font-bold" style={{ color: color ?? "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ink-muted">
        <span>{label}</span>
        <span className="font-medium text-ink">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
