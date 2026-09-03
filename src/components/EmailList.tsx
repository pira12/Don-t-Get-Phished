"use client";

import { Paperclip, Check, X } from "lucide-react";
import type { GameEmail } from "@/game/types";
import type { PerEmailFeedback } from "@/hooks/useGame";
import { Avatar } from "./Avatar";
import { formatListTime } from "@/lib/format";

export function EmailList({
  deck,
  index,
  answered,
  onSelect,
  className = "",
}: {
  deck: GameEmail[];
  index: number;
  answered: Record<string, PerEmailFeedback>;
  onSelect: (i: number) => void;
  className?: string;
}) {
  return (
    <div
      role="listbox"
      aria-label={`Inbox, email ${index + 1} of ${deck.length}`}
      className={
        "h-full w-full flex-col overflow-y-auto bg-surface thin-scroll md:w-[360px] md:shrink-0 md:border-r md:border-border " +
        className
      }
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-2 text-xs text-ink-muted">
        <span className="font-semibold text-ink">Inbox</span>
        <span aria-live="polite">Email {Math.min(index + 1, deck.length)} of {deck.length}</span>
      </div>

      <ul className="flex flex-col">
        {deck.map((email, i) => {
          const fb = answered[email.id];
          const selected = i === index;
          const unread = !fb && i >= index;
          return (
            <li key={email.id}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelect(i)}
                className={[
                  "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition",
                  selected ? "bg-selected" : "hover:bg-[var(--row-hover)]",
                ].join(" ")}
              >
                <Avatar name={email.from.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "min-w-0 flex-1 truncate text-sm",
                        unread ? "font-bold text-ink" : "font-medium text-ink-muted",
                      ].join(" ")}
                    >
                      {email.from.name}
                    </span>
                    {email.attachments && email.attachments.length > 0 && (
                      <Paperclip size={13} className="shrink-0 text-ink-faint" aria-label="Has attachment" />
                    )}
                    <span className="shrink-0 text-[11px] text-ink-faint">
                      {formatListTime(email.timestamp)}
                    </span>
                  </div>
                  <div
                    className={[
                      "truncate text-sm",
                      unread ? "font-semibold text-ink" : "text-ink-muted",
                    ].join(" ")}
                  >
                    {email.subject}
                  </div>
                  <div className="truncate text-xs text-ink-faint">{email.snippet}</div>
                </div>
                {fb && (
                  <span
                    className={[
                      "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      fb.result.correct ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
                    ].join(" ")}
                    title={fb.result.correct ? "Answered correctly" : "Answered incorrectly"}
                  >
                    {fb.result.correct ? <Check size={13} /> : <X size={13} />}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
