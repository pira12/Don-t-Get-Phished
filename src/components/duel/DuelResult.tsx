"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Frown, Minus, RefreshCw, CheckCircle2, XCircle, Home } from "lucide-react";
import type { UseDuel } from "@/hooks/useDuel";
import { TECHNIQUE_LABELS } from "@/game/types";

export function DuelResult({ duel, onRematch }: { duel: UseDuel; onRematch: () => void }) {
  const { deck, playerMoves, botMoves, playerScore, botScore, outcome, ratingDeltaValue, duelState } = duel;

  // Persist rating + history once.
  useEffect(() => {
    duel.commitResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const banner =
    outcome === "win"
      ? { icon: <Trophy className="text-success" />, text: "You win!", cls: "bg-success-soft text-success" }
      : outcome === "loss"
        ? { icon: <Frown className="text-danger" />, text: "You lost", cls: "bg-danger-soft text-danger" }
        : { icon: <Minus className="text-ink-muted" />, text: "Draw", cls: "bg-surface-2 text-ink" };

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-5 overflow-y-auto p-4 md:p-8 thin-scroll">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-surface p-6">
        <div className={["flex items-center gap-3 rounded-xl px-4 py-3", banner.cls].join(" ")}>
          {banner.icon}
          <span className="text-lg font-bold">{banner.text}</span>
          <span className="ml-auto text-sm font-medium">
            {playerScore} · {botScore}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-ink-muted">
            Rating:{" "}
            <strong className="text-ink">{duelState.rating}</strong>{" "}
            <span className={ratingDeltaValue >= 0 ? "text-success" : "text-danger"}>
              ({ratingDeltaValue >= 0 ? "+" : ""}
              {ratingDeltaValue})
            </span>
          </span>
          <span className="text-ink-muted">
            Record: <strong className="text-ink">{duelState.wins}W · {duelState.losses}L · {duelState.draws}D</strong>
          </span>
        </div>
      </motion.div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Email-by-email — every duel ends in learning</h2>
        <ul className="flex flex-col divide-y divide-border">
          {deck.map((email, i) => {
            const pm = playerMoves[i];
            const bm = botMoves[i];
            const flags = email.truth === "phishing" ? email.redFlags : [];
            return (
              <li key={email.id} className="py-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{email.subject}</div>
                    <div className="text-xs text-ink-faint">
                      {email.from.name} · truth: <strong>{email.truth}</strong>
                    </div>
                  </div>
                  <Cell label="You" ok={pm?.correct} verdict={pm?.verdict} />
                  <Cell label="Opp" ok={bm?.correct} verdict={bm?.verdict} />
                </div>
                {flags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5 pl-0">
                    {flags.map((f, k) => (
                      <span key={k} className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
                        {TECHNIQUE_LABELS[f.type]}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3 pb-4">
        <button
          onClick={onRematch}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
        >
          <RefreshCw size={15} /> Rematch
        </button>
        <button
          onClick={duel.reset}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-[var(--row-hover)]"
        >
          New opponent
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-[var(--row-hover)]"
        >
          <Home size={15} /> Back to inbox
        </Link>
      </div>
    </div>
  );
}

function Cell({ label, ok, verdict }: { label: string; ok?: boolean; verdict?: string }) {
  return (
    <div className="w-16 shrink-0 text-center">
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-0.5 flex items-center justify-center gap-1">
        {ok === undefined ? (
          <span className="text-ink-faint">—</span>
        ) : ok ? (
          <CheckCircle2 size={15} className="text-success" />
        ) : (
          <XCircle size={15} className="text-danger" />
        )}
      </div>
      <div className="text-[10px] text-ink-faint">{verdict ?? ""}</div>
    </div>
  );
}
