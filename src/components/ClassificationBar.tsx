"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { Verdict } from "@/game/types";

/**
 * The always-visible action bar in the reading pane. Mirrors Gmail's "Report"
 * styling rather than an arcade overlay. Shortcuts: P = phishing, L = legit.
 */
export function ClassificationBar({
  onAnswer,
  disabled,
}: {
  onAnswer: (v: Verdict) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border bg-surface px-4 py-3 md:px-6">
      <span className="mr-1 text-xs font-medium text-ink-muted">Your verdict:</span>
      <button
        type="button"
        onClick={() => onAnswer("phishing")}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-full border border-danger/50 bg-danger-soft px-4 py-2 text-sm font-semibold text-danger transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ShieldAlert size={16} aria-hidden />
        Report phishing
        <kbd className="ml-1 rounded border border-danger/40 px-1.5 text-[10px] font-normal">P</kbd>
      </button>
      <button
        type="button"
        onClick={() => onAnswer("legit")}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ShieldCheck size={16} aria-hidden />
        Looks legitimate
        <kbd className="ml-1 rounded border border-border px-1.5 text-[10px] font-normal">L</kbd>
      </button>
    </div>
  );
}
