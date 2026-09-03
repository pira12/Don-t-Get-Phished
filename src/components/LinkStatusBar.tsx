"use client";

import { Lock } from "lucide-react";

/**
 * Browser-style status bar pinned to the bottom-left, exactly like the one a
 * real browser shows when you hover a link — this is a primary forensic surface.
 */
export function LinkStatusBar({ href }: { href: string | null }) {
  if (!href) return null;
  const insecure = href.startsWith("http://");
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute bottom-0 left-0 z-30 max-w-[80%] truncate rounded-tr-md border-t border-r border-border bg-ink px-3 py-1.5 text-xs text-white"
      style={{ background: "var(--ink)", color: "var(--surface)" }}
    >
      <span className="inline-flex items-center gap-1.5">
        {!insecure && <Lock size={11} aria-hidden />}
        <span className="truncate">{href}</span>
      </span>
    </div>
  );
}
