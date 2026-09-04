"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Lock,
  KeyRound,
  LogIn,
  RefreshCw,
  Smartphone,
  MailOpen,
  Banknote,
  Download,
  Send,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Terminal,
  ChevronRight,
  GraduationCap,
  RotateCcw,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import {
  AFTERMATH_SCENARIOS,
  SOURCES,
  scenarioById,
  type AftermathScenario,
  type StepIcon,
} from "@/data/aftermath";

type Phase = "choose" | "login" | "capturing" | "reveal" | "timeline" | "impact" | "defense";

const STEP_ICONS: Record<StepIcon, LucideIcon> = {
  capture: KeyRound,
  login: LogIn,
  reset: RefreshCw,
  mfa: Smartphone,
  read: MailOpen,
  wire: Banknote,
  exfil: Download,
  spread: Send,
  ransom: Lock,
};

export function AftermathSim({ initialScenarioId }: { initialScenarioId?: string }) {
  const [scenario, setScenario] = useState<AftermathScenario>(() => scenarioById(initialScenarioId));
  const [phase, setPhase] = useState<Phase>(initialScenarioId ? "login" : "choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [revealPw, setRevealPw] = useState(false);
  const [revealed, setRevealed] = useState(0); // timeline steps shown

  const shownPassword = password || "(the password you typed)";
  const shownEmail = email || "you@company.com";

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); // never navigates, never submits anywhere
    setPhase("capturing");
    window.setTimeout(() => setPhase("reveal"), 1400);
  };

  const restart = () => {
    setEmail("");
    setPassword("");
    setRevealed(0);
    setRevealPw(false);
    setPhase("choose");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/learn" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Learn &amp; tools
        </Link>
        <h1 className="inline-flex items-center gap-2 text-lg font-semibold text-ink">
          <ShieldAlert size={18} className="text-danger" /> The Aftermath
        </h1>
        <span />
      </div>

      <SimBanner />

      <AnimatePresence mode="wait">
        {phase === "choose" && (
          <Fade key="choose">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-base font-semibold text-ink">See it from the attacker&apos;s side</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Clicking a phishing link and entering your details takes seconds. The damage can run
                for months. Pick a scenario and walk through exactly what a criminal does next — and
                how to stop it.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {AFTERMATH_SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setScenario(s);
                      setPhase("login");
                    }}
                    className="rounded-client border border-border bg-surface-2 p-4 text-left transition hover:border-accent"
                  >
                    <div className="font-semibold text-ink">{s.name}</div>
                    <div className="mt-0.5 text-xs text-ink-muted">{s.context}</div>
                    <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent">
                      Start <ChevronRight size={13} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Fade>
        )}

        {phase === "login" && (
          <Fade key="login">
            <p className="mb-3 text-sm text-ink-muted">{scenario.intro}</p>
            <FakeBrowser domain={scenario.fakeDomain}>
              <form onSubmit={submit} className="mx-auto max-w-sm px-6 py-8 text-center" autoComplete="off">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8]">
                  <Lock size={22} />
                </div>
                <h3 className="text-lg font-medium text-[#202124]">{scenario.loginTitle}</h3>
                <p className="mb-4 text-xs text-[#5f6368]">Enter your account details to continue</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="mb-2 w-full rounded border border-[#dadce0] px-3 py-2.5 text-sm text-[#202124] outline-none focus:border-[#1a73e8]"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="mb-4 w-full rounded border border-[#dadce0] px-3 py-2.5 text-sm text-[#202124] outline-none focus:border-[#1a73e8]"
                />
                <button type="submit" className="w-full rounded bg-[#1a73e8] px-4 py-2.5 text-sm font-medium text-white hover:brightness-110">
                  Sign in
                </button>
                <p className="mt-3 text-[10px] text-[#80868b]">
                  Simulation — no data leaves your browser. Type anything (or nothing) and press Sign in.
                </p>
              </form>
            </FakeBrowser>
          </Fade>
        )}

        {phase === "capturing" && (
          <Fade key="capturing">
            <FakeBrowser domain={scenario.fakeDomain}>
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <RefreshCw size={26} className="mb-3 animate-spin text-[#1a73e8]" />
                <p className="text-sm text-[#5f6368]">Signing you in…</p>
              </div>
            </FakeBrowser>
          </Fade>
        )}

        {phase === "reveal" && (
          <Fade key="reveal">
            <Console>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#f87171]">
                <Terminal size={14} /> attacker console · session captured
              </div>
              <p className="mt-3 text-sm text-[#c9d1d9]">
                That login page wasn&apos;t real. Here&apos;s what the attacker just received —
                instantly, in plain text:
              </p>
              <div className="mt-3 rounded-md border border-[#30363d] bg-[#0d1117] p-3 font-mono text-sm">
                <div className="text-[#8b949e]">captured_credentials {"{"}</div>
                <div className="pl-4 text-[#e6edf3]">
                  email: <span className="text-[#7ee787]">{shownEmail}</span>
                </div>
                <div className="flex items-center gap-2 pl-4 text-[#e6edf3]">
                  password:{" "}
                  <span className="text-[#f87171]">{revealPw ? shownPassword : "•".repeat(Math.max(8, password.length || 10))}</span>
                  <button onClick={() => setRevealPw((v) => !v)} className="text-[#8b949e] hover:text-white" aria-label="Toggle password">
                    {revealPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <div className="pl-4 text-[#e6edf3]">
                  session_cookie: <span className="text-[#f0883e]">stolen ✓</span>
                </div>
                <div className="text-[#8b949e]">{"}"}</div>
              </div>
              <p className="mt-3 text-xs text-[#8b949e]">
                A real attacker never shows you this screen — you&apos;d see a normal “page not
                found”, and never know. Here&apos;s what they do with it over the next 24 hours.
              </p>
              <button
                onClick={() => {
                  setPhase("timeline");
                  setRevealed(1);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f87171] px-5 py-2.5 text-sm font-semibold text-[#0b0e14] hover:brightness-110"
              >
                Play the aftermath <ArrowRight size={15} />
              </button>
            </Console>
          </Fade>
        )}

        {phase === "timeline" && (
          <Fade key="timeline">
            <Timeline
              scenario={scenario}
              revealed={revealed}
              onNext={() => setRevealed((r) => Math.min(r + 1, scenario.steps.length))}
              onShowAll={() => setRevealed(scenario.steps.length)}
              onDone={() => setPhase("impact")}
            />
          </Fade>
        )}

        {phase === "impact" && (
          <Fade key="impact">
            <div className="rounded-2xl border border-danger/40 bg-danger-soft p-6">
              <h2 className="text-base font-semibold text-ink">One click. This is the bill.</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Realistic ranges for {scenario.context.toLowerCase()} — illustrative, from public reporting.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {scenario.impact.map((s) => (
                  <div key={s.label} className="rounded-client border border-border bg-surface p-3 text-center">
                    <div className="text-xl font-bold text-danger">{s.value}</div>
                    <div className="text-[11px] font-medium text-ink">{s.label}</div>
                    {s.note && <div className="mt-0.5 text-[10px] text-ink-faint">{s.note}</div>}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPhase("defense")}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
              >
                How you stop all of this <ArrowRight size={15} />
              </button>
            </div>
          </Fade>
        )}

        {phase === "defense" && (
          <Fade key="defense">
            <div className="rounded-2xl border border-success/40 bg-success-soft p-6">
              <h2 className="inline-flex items-center gap-2 text-base font-semibold text-ink">
                <ShieldAlert size={18} className="text-success" /> The good news: step 0 is entirely in your hands
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Every consequence above traces back to one click. Break that link and none of it happens.
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {scenario.defenses.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-client border border-border bg-surface px-3 py-2 text-sm text-ink">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    {d}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110">
                  Back to training
                </Link>
                <Link href="/learn" className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-[var(--row-hover)]">
                  <GraduationCap size={15} /> Real tools to stay safe
                </Link>
                <button onClick={restart} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-[var(--row-hover)]">
                  <RotateCcw size={15} /> Try another scenario
                </button>
              </div>

              <div className="mt-5 border-t border-border pt-3">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Sources (figures are illustrative)</div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {SOURCES.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline">
                        {s.name} <ExternalLink size={10} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Fade>
        )}
      </AnimatePresence>
    </div>
  );
}

function SimBanner() {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-[color:var(--warning)]/40 bg-warning-soft px-3 py-2 text-xs text-[color:var(--warning)]">
      <ShieldAlert size={15} className="mt-0.5 shrink-0" />
      <span>
        <strong>This is a safe simulation.</strong> The login below is fake and inert — nothing you
        type is sent, stored, or leaves your browser. It exists only to show you the consequences.
      </span>
    </div>
  );
}

function FakeBrowser({ domain, children }: { domain: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-popover">
      <div className="flex items-center gap-2 bg-[#f1f3f4] px-3 py-2">
        <span className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <div className="ml-2 flex flex-1 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-[#5f6368]">
          <Lock size={11} className="text-[#5f6368]" />
          <span className="truncate">https://{domain}</span>
        </div>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

function Console({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#30363d] bg-[#0b0e14] p-6 text-[#c9d1d9]">{children}</div>
  );
}

function Timeline({
  scenario,
  revealed,
  onNext,
  onShowAll,
  onDone,
}: {
  scenario: AftermathScenario;
  revealed: number;
  onNext: () => void;
  onShowAll: () => void;
  onDone: () => void;
}) {
  const steps = scenario.steps;
  const all = revealed >= steps.length;
  const shown = useMemo(() => steps.slice(0, revealed), [steps, revealed]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">The next 24 hours — {scenario.context}</h2>
        <span className="text-xs text-ink-faint">
          {Math.min(revealed, steps.length)} / {steps.length}
        </span>
      </div>

      <ol className="relative flex flex-col gap-3 border-l border-border pl-6">
        <AnimatePresence initial={false}>
          {shown.map((step, i) => {
            const Icon = STEP_ICONS[step.icon];
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="relative"
              >
                <span className="absolute -left-[34px] flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white">
                  <Icon size={13} />
                </span>
                <div className="rounded-client border border-border bg-surface-2 p-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-danger-soft px-1.5 py-0.5 font-mono text-[11px] font-semibold text-danger">{step.t}</span>
                    <span className="text-sm font-semibold text-ink">{step.action}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-ink-muted">{step.impact}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    <span className="font-medium text-[color:var(--warning)]">Why it worked: </span>
                    {step.why}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>

      <div className="mt-5 flex flex-wrap gap-2">
        {!all ? (
          <>
            <button onClick={onNext} className="inline-flex items-center gap-2 rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110">
              Next step <ArrowRight size={15} />
            </button>
            <button onClick={onShowAll} className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-[var(--row-hover)]">
              Show all
            </button>
          </>
        ) : (
          <button onClick={onDone} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110">
            See the total impact <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function Fade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  );
}
