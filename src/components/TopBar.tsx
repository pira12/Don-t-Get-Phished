"use client";

import Link from "next/link";
import { Search, ShieldCheck, Menu, BarChart3, Keyboard, Trophy } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { AccountMenu } from "./AccountMenu";

/**
 * A neutral, generic mail-client top bar. No trademarked wordmark — a generic
 * product name ("Sentinel Mail") and a shield mark.
 */
export function TopBar({
  handle,
  onShortcuts,
}: {
  handle: string;
  onShortcuts: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-canvas px-3 md:gap-4 md:px-5">
      <button className="rounded-full p-2 text-ink-muted hover:bg-[var(--row-hover)] md:hidden" aria-label="Menu">
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-2 pr-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[color:var(--accent-ink)]">
          <ShieldCheck size={18} aria-hidden />
        </span>
        <span className="hidden text-lg font-medium text-ink sm:block">Sentinel Mail</span>
      </div>

      <div className="flex max-w-2xl flex-1 items-center gap-3 rounded-full bg-surface-2 px-4 py-2.5 text-ink-muted">
        <Search size={18} aria-hidden />
        <input
          type="text"
          placeholder="Search mail"
          aria-label="Search mail (decorative)"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <ThemeSwitcher />
        <button
          onClick={onShortcuts}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
          className="hidden rounded-full border border-border p-2 text-ink-muted hover:bg-[var(--row-hover)] sm:block"
        >
          <Keyboard size={16} />
        </button>
        <Link
          href="/stats"
          aria-label="Your stats"
          title="Your stats"
          className="hidden rounded-full border border-border p-2 text-ink-muted hover:bg-[var(--row-hover)] sm:block"
        >
          <BarChart3 size={16} />
        </Link>
        <Link
          href="/leaderboard"
          aria-label="Leaderboards"
          title="Leaderboards"
          className="hidden rounded-full border border-border p-2 text-ink-muted hover:bg-[var(--row-hover)] sm:block"
        >
          <Trophy size={16} />
        </Link>
        <div className="flex items-center gap-2 pl-1">
          <AccountMenu handle={handle} />
        </div>
      </div>
    </header>
  );
}
