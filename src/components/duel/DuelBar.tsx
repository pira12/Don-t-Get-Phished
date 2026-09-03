"use client";

import { Bot, User, Timer } from "lucide-react";

/**
 * The competitive chrome that lives AROUND the realistic inbox during a duel:
 * both scores, a subtle progress bar per side (no answer leakage), and a timer.
 */
export function DuelBar({
  you,
  opponentName,
  playerScore,
  botScore,
  playerProgress,
  botProgress,
  total,
  emailNumber,
  secondsOnEmail,
}: {
  you: string;
  opponentName: string;
  playerScore: number;
  botScore: number;
  playerProgress: number; // 0..1
  botProgress: number; // 0..1
  total: number;
  emailNumber: number;
  secondsOnEmail: number;
}) {
  const ahead = playerScore >= botScore;
  return (
    <div className="border-b border-border bg-surface px-4 py-2.5">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
          <User size={14} className="text-accent" /> {you || "You"}
          <span className="ml-1 rounded bg-accent-soft px-1.5 py-0.5 text-accent">{playerScore}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-ink-muted">
          <Timer size={13} /> {secondsOnEmail}s · Email {emailNumber} of {total}
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
          <span className="mr-1 rounded bg-surface-2 px-1.5 py-0.5 text-ink-muted">{botScore}</span>
          {opponentName} <Bot size={14} className="text-ink-muted" />
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Track value={playerProgress} color="var(--accent)" />
        <span className={["text-[10px] font-semibold", ahead ? "text-success" : "text-ink-faint"].join(" ")}>
          {ahead ? "AHEAD" : "BEHIND"}
        </span>
        <Track value={botProgress} color="var(--ink-faint)" reverse />
      </div>
    </div>
  );
}

function Track({ value, color, reverse }: { value: number; color: string; reverse?: boolean }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`,
          background: color,
          marginLeft: reverse ? "auto" : undefined,
        }}
      />
    </div>
  );
}
