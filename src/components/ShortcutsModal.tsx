"use client";

import { X } from "lucide-react";

const SHORTCUTS: [string, string][] = [
  ["!", "Report phishing (same key as Gmail)"],
  ["E", "Archive — it looks safe (Gmail archive)"],
  ["#", "Delete (Gmail delete)"],
  ["Enter", "Next email / continue"],
  ["↑ / ↓", "Move through the email list"],
  ["H", "Show original (headers)"],
  ["S", "Toggle sender details"],
  ["?", "Show this help"],
];

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={onClose}
    >
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-popover" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Keyboard shortcuts</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-ink-muted hover:bg-[var(--row-hover)]">
            <X size={18} />
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {SHORTCUTS.map(([key, label]) => (
            <li key={key} className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">{label}</span>
              <kbd className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-xs text-ink">
                {key}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
