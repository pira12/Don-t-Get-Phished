"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ShieldCheck,
  LayoutPanelLeft,
  MousePointerClick,
  ScanSearch,
  MessageSquareWarning,
  Trophy,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Link2,
  ChevronDown,
  FileSearch,
  Paperclip,
  Radar,
  type LucideIcon,
} from "lucide-react";

const KEY = "izd.onboarded.v1";

type Step = {
  icon: LucideIcon;
  title: string;
  body: ReactNode;
  visual?: ReactNode;
};

const STEPS: Step[] = [
  {
    icon: ShieldCheck,
    title: "Welcome — your job is to spot the fakes",
    body: (
      <>
        Your inbox is a realistic mix of genuine emails and <strong>AI-generated phishing</strong>.
        Read each one, investigate it, and decide: phishing or legitimate. No login needed — just
        start playing.
      </>
    ),
  },
  {
    icon: LayoutPanelLeft,
    title: "It looks like a real inbox",
    body: (
      <>
        Pick an email from the <strong>list</strong>, read it in the <strong>reading pane</strong>,
        and watch your score in the <strong>side panel</strong>. Switch the Gmail / Outlook theme and
        light/dark any time — the game stays exactly the same.
      </>
    ),
    visual: (
      <div className="flex gap-1.5 text-[9px] font-medium text-ink-muted">
        <div className="flex w-10 flex-col gap-1 rounded bg-surface-2 p-1.5 text-center">Folders</div>
        <div className="flex w-16 flex-col gap-1 rounded bg-surface-2 p-1.5">
          <div className="rounded bg-selected px-1 py-0.5 text-ink">Email ●</div>
          <div className="rounded bg-surface px-1 py-0.5">Email</div>
          <div className="rounded bg-surface px-1 py-0.5">Email</div>
        </div>
        <div className="flex flex-1 flex-col justify-center rounded border border-accent/40 bg-surface-2 p-1.5 text-center text-accent">
          Read + tools
        </div>
        <div className="flex w-12 flex-col items-center justify-center rounded bg-surface-2 p-1.5 text-center">Score</div>
      </div>
    ),
  },
  {
    icon: ScanSearch,
    title: "Investigate with real inbox tools",
    body: "Don't guess — check. These mirror what real email clients do, so the skill transfers straight to your own inbox:",
    visual: (
      <ul className="flex flex-col gap-1.5 text-xs text-ink">
        <ToolRow icon={<Link2 size={14} />} label="Hover a link" desc="see the true destination in the status bar" />
        <ToolRow icon={<ChevronDown size={14} />} label="Click “to me”" desc="reveal sender, reply-to & authentication" />
        <ToolRow icon={<FileSearch size={14} />} label="Show original" desc="read the raw headers + SPF/DKIM/DMARC" />
        <ToolRow icon={<MousePointerClick size={14} />} label="Click / right-click a link" desc="inspect the real domain vs the text" />
        <ToolRow icon={<Paperclip size={14} />} label="Open an attachment chip" desc="spot dangerous or spoofed file types" />
      </ul>
    ),
  },
  {
    icon: MessageSquareWarning,
    title: "Take the real action",
    body: (
      <>
        You act exactly like in Gmail/Outlook, so the habit sticks: <strong>Report</strong> a phish,{" "}
        <strong>Archive</strong> mail that&apos;s safe, or <strong>Delete</strong>. Reporting the phish
        and keeping the safe mail earns the most — deleting works but is weaker, and reporting real
        mail counts against you.
      </>
    ),
    visual: (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/50 bg-danger-soft px-3 py-1.5 text-xs font-semibold text-danger">
          Report <kbd className="rounded border border-danger/40 px-1.5 text-[10px]">!</kbd>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink">
          Archive <kbd className="rounded border border-border px-1.5 text-[10px]">E</kbd>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-muted">
          Delete <kbd className="rounded border border-border px-1.5 text-[10px]">#</kbd>
        </span>
      </div>
    ),
  },
  {
    icon: ShieldCheck,
    title: "Learn from every answer",
    body: (
      <>
        After each call you get instant feedback: for phishing, the exact <strong>red flags</strong>{" "}
        (click one to jump to it in the email); for legit mail, the reassuring signals. Miss a nasty
        one and you can even see it <strong>from the attacker&apos;s side</strong>.
      </>
    ),
    visual: (
      <div className="flex flex-col gap-1.5">
        <span className="inline-flex w-fit items-center gap-2 rounded-md bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
          ✓ Correct — this was phishing
        </span>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">Lookalike domain</span>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">Urgency</span>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">Auth fail</span>
        </div>
      </div>
    ),
  },
  {
    icon: Trophy,
    title: "Level up & compete",
    body: (
      <>
        Earn XP, climb tiers (Bronze → Threat Hunter), keep streaks, and unlock skill badges. Try the{" "}
        <strong>Daily challenge</strong> (same for everyone), <strong>Duel</strong> a bot or a real
        person, and see how you rank on <strong>leaderboards</strong>.
      </>
    ),
    visual: (
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
        <span className="rounded-full bg-accent px-3 py-1 text-[color:var(--accent-ink)]">Daily</span>
        <span className="rounded-full border border-border px-3 py-1 text-ink-muted">Duel</span>
        <span className="rounded-full border border-border px-3 py-1 text-ink-muted">Leaderboard</span>
        <span className="ml-1 inline-flex items-center gap-1 text-ink-muted">
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2"><span className="block h-full w-2/3 rounded-full bg-accent" /></span>
          XP
        </span>
      </div>
    ),
  },
  {
    icon: Radar,
    title: "Phishing isn't only email",
    body: (
      <>
        Attackers also use <strong>text messages, phone calls, chat &amp; DMs, and QR codes</strong>.
        The <strong>Practice</strong> page (radar icon, top-right) drills the same spot-it habit across
        every channel — or take a <strong>Mixed</strong> round that switches channel each time. It all
        feeds one score and your stats.
      </>
    ),
  },
  {
    icon: GraduationCap,
    title: "Go deeper when you're ready",
    body: (
      <>
        The <strong>Learn</strong> page lists real, free tools to check and report phishing in your
        actual inbox. Press <kbd className="rounded border border-border px-1 text-[10px]">?</kbd> any
        time for keyboard shortcuts. That&apos;s it — let&apos;s go.
      </>
    ),
  },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const last = i === STEPS.length - 1;
  const step = STEPS[i];
  const Icon = step.icon;

  const finish = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    onDone();
  };

  const next = () => (last ? finish() : setI((n) => Math.min(n + 1, STEPS.length - 1)));
  const back = () => setI((n) => Math.max(0, n - 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, last]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="How to play"
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-popover">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            <ShieldCheck size={14} className="text-accent" /> How to play · {i + 1} of {STEPS.length}
          </span>
          <button onClick={finish} className="text-xs text-ink-muted underline hover:text-ink">
            Skip
          </button>
        </div>

        <div className="thin-scroll flex-1 overflow-y-auto px-6 py-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Icon size={26} aria-hidden />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-ink">{step.title}</h2>
          <p className="text-sm leading-relaxed text-ink-muted">{step.body}</p>
          {step.visual && <div className="mt-4 rounded-xl border border-border bg-surface-2 p-3">{step.visual}</div>}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <div className="flex gap-1.5" aria-hidden>
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={["h-1.5 rounded-full transition-all", idx === i ? "w-5 bg-accent" : "w-1.5 bg-border hover:bg-ink-faint"].join(" ")}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button
                onClick={back}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-[var(--row-hover)]"
              >
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button
              onClick={next}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
            >
              {last ? "Start playing" : "Next"}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolRow({ icon, label, desc }: { icon: ReactNode; label: string; desc: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">{icon}</span>
      <span>
        <strong>{label}</strong> <span className="text-ink-muted">— {desc}</span>
      </span>
    </li>
  );
}

export function hasOnboarded(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
