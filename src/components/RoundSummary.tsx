"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, RefreshCw, TrendingUp, BarChart3 } from "lucide-react";
import type { UseGame } from "@/hooks/useGame";
import type { Difficulty, RedFlagType } from "@/game/types";
import { TECHNIQUE_LABELS } from "@/game/types";

const NEXT_DIFFICULTY: Record<Difficulty, Difficulty | "mixed"> = {
  easy: "medium",
  medium: "hard",
  hard: "mixed",
};

export function RoundSummary({ game }: { game: UseGame }) {
  const { answered, roundScore, config, startRound, finalizeRound } = game;
  const answers = useMemo(() => Object.values(answered), [answered]);

  // Roll up round-level achievements + daily streak exactly once.
  useEffect(() => {
    finalizeRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = answers.length;
  const correct = answers.filter((a) => a.result.correct).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const falsePositives = answers.filter((a) => a.result.falsePositive).length;
  const falseNegatives = answers.filter((a) => a.result.falseNegative).length;

  // Technique breakdown: caught vs missed among phishing emails.
  const techniqueRows = useMemo(() => {
    const seen: Partial<Record<RedFlagType, number>> = {};
    const caught: Partial<Record<RedFlagType, number>> = {};
    for (const a of answers) {
      if (a.email.truth !== "phishing") continue;
      for (const t of a.email.techniqueTags ?? []) {
        seen[t] = (seen[t] ?? 0) + 1;
        if (a.result.correct) caught[t] = (caught[t] ?? 0) + 1;
      }
    }
    return (Object.keys(seen) as RedFlagType[])
      .map((t) => ({ t, seen: seen[t]!, caught: caught[t] ?? 0 }))
      .sort((a, b) => a.caught / a.seen - b.caught / b.seen);
  }, [answers]);

  const curDiff = (config.difficulty ?? "easy") as Difficulty;
  const nextDiff = NEXT_DIFFICULTY[curDiff] ?? "mixed";

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-5 overflow-y-auto p-4 md:p-8 thin-scroll">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-surface p-6"
      >
        <h1 className="text-xl font-semibold text-ink">Round complete</h1>
        <p className="mt-1 text-sm text-ink-muted">
          You judged {total} emails on {curDiff} difficulty.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Big label="Accuracy" value={`${accuracy}%`} />
          <Big label="Points" value={roundScore.toLocaleString()} />
          <Big label="Correct" value={`${correct}/${total}`} />
          <Big label="Best streak" value={String(game.stats.bestStreak)} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MissBox
            icon={<XCircle size={16} className="text-danger" />}
            label="Missed phishing"
            sub="False negatives — the dangerous kind"
            value={falseNegatives}
          />
          <MissBox
            icon={<XCircle size={16} className="text-[color:var(--warning)]" />}
            label="Over-flagged safe mail"
            sub="False positives — erodes trust in real mail"
            value={falsePositives}
          />
        </div>
      </motion.div>

      {techniqueRows.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <BarChart3 size={16} aria-hidden /> Techniques this round
          </h2>
          <ul className="flex flex-col gap-2.5">
            {techniqueRows.map(({ t, seen, caught }) => {
              const pct = Math.round((caught / seen) * 100);
              return (
                <li key={t} className="flex items-center gap-3">
                  <span className="w-48 shrink-0 truncate text-xs text-ink-muted">{TECHNIQUE_LABELS[t]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: pct >= 100 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)" }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right text-xs font-medium text-ink">
                    {caught}/{seen}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Every email, reviewed</h2>
        <ul className="flex flex-col divide-y divide-border">
          {answers.map((a) => (
            <li key={a.email.id} className="flex items-start gap-3 py-2.5">
              {a.result.correct ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
              ) : (
                <XCircle size={16} className="mt-0.5 shrink-0 text-danger" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-ink">{a.email.subject}</div>
                <div className="text-xs text-ink-faint">
                  {a.email.from.name} · truth: <strong>{a.email.truth}</strong> · you said {a.verdict}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3 pb-4">
        <button
          onClick={() => startRound({ ...config })}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
        >
          <RefreshCw size={15} /> Play again
        </button>
        <button
          onClick={() => startRound({ ...config, difficulty: nextDiff })}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-[var(--row-hover)]"
        >
          <TrendingUp size={15} /> Next difficulty ({nextDiff})
        </button>
        {techniqueRows.length > 0 && (
          <button
            onClick={() =>
              startRound({
                ...config,
                difficulty: "mixed",
                focusTechniques: techniqueRows.slice(0, 3).map((r) => r.t),
              })
            }
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-[var(--row-hover)]"
          >
            Train my weak spots
          </button>
        )}
        <Link
          href="/stats"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-[var(--row-hover)]"
        >
          <BarChart3 size={15} /> View stats
        </Link>
      </div>
    </div>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-client border border-border bg-surface-2 p-3 text-center">
      <div className="text-2xl font-bold text-ink">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</div>
    </div>
  );
}

function MissBox({
  icon,
  label,
  sub,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  value: number;
}) {
  return (
    <div className="flex items-start gap-2 rounded-client border border-border bg-surface-2 p-3">
      {icon}
      <div>
        <div className="text-sm font-semibold text-ink">
          {value} · {label}
        </div>
        <div className="text-[11px] text-ink-faint">{sub}</div>
      </div>
    </div>
  );
}
