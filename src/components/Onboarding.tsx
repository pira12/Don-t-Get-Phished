"use client";

import { useState } from "react";
import { MailWarning, MousePointerClick, ShieldQuestion, ArrowRight } from "lucide-react";

const CARDS = [
  {
    icon: MailWarning,
    title: "Some of these emails are fake",
    body: "Your inbox is a mix of real messages and AI-generated phishing. Your job is to tell them apart.",
  },
  {
    icon: MousePointerClick,
    title: "Use the tools real inboxes give you",
    body: "Hover a link to see where it really goes. Expand “to me” for sender details. Open “Show original” to read the headers.",
  },
  {
    icon: ShieldQuestion,
    title: "Classify each as Phishing or Legit",
    body: "Report phishing (P) or mark it legitimate (L). You’ll get instant feedback showing exactly what gave it away.",
  },
];

const KEY = "izd.onboarded.v1";

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const Card = CARDS[i].icon;
  const last = i === CARDS.length - 1;

  const finish = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-popover">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Welcome to Don&apos;t Get Phished
          </span>
          <button onClick={finish} className="text-xs text-ink-muted underline hover:text-ink">
            Skip intro
          </button>
        </div>

        <div className="flex flex-col items-center py-4 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Card size={28} aria-hidden />
          </span>
          <h2 className="mb-2 text-lg font-semibold text-ink">{CARDS[i].title}</h2>
          <p className="text-sm text-ink-muted">{CARDS[i].body}</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {CARDS.map((_, idx) => (
              <span
                key={idx}
                className={["h-1.5 rounded-full transition-all", idx === i ? "w-5 bg-accent" : "w-1.5 bg-border"].join(" ")}
              />
            ))}
          </div>
          <button
            onClick={() => (last ? finish() : setI((n) => n + 1))}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
          >
            {last ? "Start playing" : "Next"}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function hasOnboarded(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
