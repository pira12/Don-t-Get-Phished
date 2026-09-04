"use client";

import { ShieldAlert, Archive, Trash2 } from "lucide-react";
import type { MailAction } from "@/game/scoring";

/**
 * The decision bar — but framed as the REAL actions you take in Gmail/Outlook, so
 * the muscle memory transfers: Report a phish, Archive (keep) safe mail, or Delete.
 * Report the phish and keep the safe mail earns the most; Delete is a valid but
 * weaker middle. Shortcuts mirror real clients: ! report · E archive · # delete.
 */
export function ClassificationBar({
  onAction,
  disabled,
}: {
  onAction: (a: MailAction) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface px-4 py-3 md:px-6">
      <span className="mr-1 text-xs font-medium text-ink-muted">What do you do?</span>
      <button
        type="button"
        onClick={() => onAction("report")}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-full border border-danger/50 bg-danger-soft px-4 py-2 text-sm font-semibold text-danger transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ShieldAlert size={16} aria-hidden />
        Report phishing
        <kbd className="ml-1 rounded border border-danger/40 px-1.5 text-[10px] font-normal">!</kbd>
      </button>
      <button
        type="button"
        onClick={() => onAction("archive")}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Archive size={16} aria-hidden />
        Archive <span className="font-normal text-ink-muted">— looks safe</span>
        <kbd className="ml-1 rounded border border-border px-1.5 text-[10px] font-normal">E</kbd>
      </button>
      <button
        type="button"
        onClick={() => onAction("delete")}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-[var(--row-hover)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2 size={16} aria-hidden />
        Delete
        <kbd className="ml-1 rounded border border-border px-1.5 text-[10px] font-normal">#</kbd>
      </button>
    </div>
  );
}
