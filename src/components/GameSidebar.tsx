"use client";

import { useEffect, useState } from "react";
import { Flame, Trophy, Target, Zap, PanelRightClose, PanelRightOpen } from "lucide-react";
import type { UseGame } from "@/hooks/useGame";

const KEY = "izd.sidebar.collapsed";

/**
 * The clean, sober game panel that lives beside the inbox — never inside it.
 * Score, streak, XP/level/tier: gamification kept out of the realistic client.
 * Collapsible so it gives the inbox back its real estate when you don't need it.
 */
export function GameSidebar({ game }: { game: UseGame }) {
  const { roundScore, streak, level, tier, stats, deck, answeredCount } = game;
  const accuracy =
    stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;

  // Init false (matches SSR) then hydrate the saved preference on mount.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);
  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  if (collapsed) {
    return (
      <aside className="hidden w-12 shrink-0 flex-col items-center gap-3 border-l border-border bg-canvas py-3 lg:flex">
        <button
          onClick={toggle}
          title="Show score panel"
          aria-label="Expand score panel"
          className="rounded-full p-2 text-ink-muted transition hover:bg-[var(--row-hover)]"
        >
          <PanelRightOpen size={18} />
        </button>
        <div className="flex flex-col items-center gap-1" title={`${roundScore} points · streak ${streak}`}>
          <span className="text-[9px] uppercase tracking-wide text-ink-faint">Pts</span>
          <span className="text-sm font-bold text-ink">{roundScore.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-[color:var(--warning)]" title={`${streak} streak`}>
          <Flame size={15} aria-hidden />
          <span className="text-xs font-semibold">{streak}</span>
        </div>
        <div className="mt-1 flex flex-col items-center gap-0.5" style={{ color: tier.color }} title={`${tier.name} · Level ${level.level}`}>
          <Trophy size={15} aria-hidden />
          <span className="text-[10px] font-semibold text-ink-muted">Lv{level.level}</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-border bg-canvas p-4 thin-scroll lg:flex">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Your progress</span>
        <button
          onClick={toggle}
          title="Collapse score panel"
          aria-label="Collapse score panel"
          className="rounded-full p-1.5 text-ink-muted transition hover:bg-[var(--row-hover)]"
        >
          <PanelRightClose size={16} />
        </button>
      </div>

      <div className="rounded-client border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">This round</span>
          <span className="text-xs text-ink-muted">
            {answeredCount}/{deck.length}
          </span>
        </div>
        <div className="mt-1 text-3xl font-bold text-ink">{roundScore.toLocaleString()}</div>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-[color:var(--warning)]">
          <Flame size={15} aria-hidden />
          <span className="font-semibold">{streak}</span>
          <span className="text-ink-faint">streak</span>
        </div>
      </div>

      <div className="rounded-client border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: tier.color }}>
            <Trophy size={15} aria-hidden /> {tier.name}
          </span>
          <span className="text-xs text-ink-muted">Lv {level.level}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${Math.round(level.progress * 100)}%` }}
          />
        </div>
        <div className="mt-1 text-[11px] text-ink-faint">
          {level.intoLevel} / {level.span} XP to level {level.level + 1}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Target size={14} />} label="Accuracy" value={`${accuracy}%`} />
        <Stat icon={<Zap size={14} />} label="Best streak" value={String(stats.bestStreak)} />
        <Stat icon={<Flame size={14} />} label="Daily streak" value={`${stats.dailyStreak}d`} />
        <Stat icon={<Trophy size={14} />} label="Total XP" value={stats.xp.toLocaleString()} />
      </div>

      <div className="rounded-client border border-border bg-surface p-3 text-[11px] leading-relaxed text-ink-muted">
        <p className="mb-1 font-semibold text-ink">How scoring works</p>
        Correct calls earn points; investigating with the tools before you answer,
        answering quickly, and keeping a streak all add bonuses. Over-flagging safe
        mail costs you accuracy.
      </div>
    </aside>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-client border border-border bg-surface p-3">
      <div className="flex items-center gap-1.5 text-ink-faint">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 text-lg font-bold text-ink">{value}</div>
    </div>
  );
}
