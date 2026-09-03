"use client";

import { useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";

const KEY = "izd.hint.link.v1";

/** One-time contextual tip, shown once and dismissible — instead of a manual. */
export function HintBubble() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) !== "1") {
        const t = window.setTimeout(() => setShow(true), 1400);
        return () => window.clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-xs items-start gap-3 rounded-client border border-border bg-surface p-3 shadow-popover">
      <span className="mt-0.5 text-[color:var(--warning)]">
        <Lightbulb size={18} aria-hidden />
      </span>
      <div className="text-sm text-ink">
        <strong>Tip:</strong> hover a link to see where it really goes, and click “to me” to check
        the sender.
      </div>
      <button onClick={dismiss} aria-label="Dismiss tip" className="text-ink-muted hover:text-ink">
        <X size={16} />
      </button>
    </div>
  );
}
