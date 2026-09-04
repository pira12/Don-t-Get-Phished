"use client";

import { useEffect } from "react";
import type { Channel } from "@/game/types";
import type { MailAction } from "@/game/scoring";
import { CHANNEL_ACTIONS } from "@/game/channels";
import { ChannelIcon } from "./icons";

/**
 * The decision bar for any channel. Same three canonical actions the email game
 * scores (report / archive / delete), but labelled for the channel so the muscle
 * memory matches the real app. Keyboard shortcuts mirror the email bar: ! · E · #.
 */
export function ScenarioActionBar({
  channel,
  onAction,
  disabled,
}: {
  channel: Channel;
  onAction: (a: MailAction) => void;
  disabled: boolean;
}) {
  const actions = CHANNEL_ACTIONS[channel];

  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const hit = actions.find((a) => a.shortcut === e.key);
      if (hit) {
        e.preventDefault();
        onAction(hit.canonical);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions, disabled, onAction]);

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface px-4 py-3 md:px-6">
      <span className="mr-1 text-xs font-medium text-ink-muted">What do you do?</span>
      {actions.map((a) => {
        const cls =
          a.tone === "danger"
            ? "border-danger/50 bg-danger-soft text-danger"
            : a.tone === "safe"
              ? "border-border bg-surface-2 text-ink"
              : "border-border text-ink-muted";
        return (
          <button
            key={a.canonical}
            type="button"
            onClick={() => onAction(a.canonical)}
            disabled={disabled}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40",
              cls,
              a.tone === "neutral" ? "font-medium hover:bg-[var(--row-hover)]" : "",
            ].join(" ")}
          >
            <ChannelIcon name={a.icon} size={16} />
            {a.label}
            {a.hint && <span className="font-normal text-ink-muted">— {a.hint}</span>}
            {a.shortcut && (
              <kbd className="ml-1 rounded border border-current/30 px-1.5 text-[10px] font-normal opacity-70">
                {a.shortcut}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}
