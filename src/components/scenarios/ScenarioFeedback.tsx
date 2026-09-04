"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, Search, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import type { Scenario } from "@/game/types";
import { TECHNIQUE_LABELS } from "@/game/types";
import type { AnswerResult, MailAction } from "@/game/scoring";
import { actionCoaching } from "@/game/channels";

/** Channel-agnostic feedback: verdict banner, red flags or safe signals, coaching,
 * and (for a missed credential-harvest scenario) the attacker's-side link. */
export function ScenarioFeedback({
  scenario,
  result,
  action,
  isLast,
  onNext,
}: {
  scenario: Scenario;
  result: AnswerResult;
  action: MailAction;
  isLast: boolean;
  onNext: () => void;
}) {
  const correct = result.correct;
  const truthLabel = scenario.truth === "phishing" ? "a scam" : "genuine";
  const acceptable = correct && result.quality === "acceptable";
  const tone = !correct ? "danger" : acceptable ? "warning" : "success";
  const bg = tone === "danger" ? "bg-danger-soft" : tone === "warning" ? "bg-warning-soft" : "bg-success-soft";
  const fg = tone === "danger" ? "text-danger" : tone === "warning" ? "text-[color:var(--warning)]" : "text-success";
  const headline = !correct ? "Not quite." : acceptable ? "Good instinct — but not the best move." : "Correct!";
  const note = actionCoaching(scenario.channel, scenario.truth, action, result.quality);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      aria-label="Feedback"
      className="border-t-2 border-border bg-surface-2"
    >
      <div className={["flex items-center gap-3 px-4 py-3 md:px-6", bg].join(" ")}>
        {correct ? <CheckCircle2 className={fg} aria-hidden /> : <XCircle className="text-danger" aria-hidden />}
        <div className="flex-1">
          <p className={["font-semibold", fg].join(" ")}>{headline}</p>
          <p className="text-sm text-ink-muted">
            This was <strong>{truthLabel}</strong>. {note}
          </p>
        </div>
        {correct && (
          <div className="text-right">
            <div className={["text-lg font-bold", fg].join(" ")}>+{result.points}</div>
            <div className="text-[11px] text-ink-muted">streak ×{result.newStreak}</div>
          </div>
        )}
      </div>

      <div className="px-4 py-4 md:px-6">
        {scenario.truth === "phishing" ? (
          <>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <Search size={15} aria-hidden /> Red flags
            </h3>
            <ul className="flex flex-col gap-2">
              {scenario.redFlags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 rounded-client border border-border bg-surface px-3 py-2">
                  <span className="mt-0.5 whitespace-nowrap rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                    {TECHNIQUE_LABELS[flag.type]}
                  </span>
                  <span className="flex-1 text-xs text-ink-muted">{flag.explanation}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <CheckCircle2 size={15} className="text-success" aria-hidden /> Why this one was safe
            </h3>
            <ul className="flex flex-col gap-1.5">
              {(scenario.legitSignals ?? []).map((sig, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-success" aria-hidden />
                  {sig}
                </li>
              ))}
            </ul>
          </>
        )}

        {!correct && scenario.truth === "phishing" && missedCredHarvest(scenario) && (
          <Link
            href={`/aftermath?scenario=${aftermathFor(scenario)}`}
            className="mt-3 flex items-center gap-3 rounded-client border border-danger/40 bg-danger-soft px-3 py-2.5 text-left transition hover:brightness-95"
          >
            <ShieldAlert size={20} className="shrink-0 text-danger" aria-hidden />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-danger">
                That would have worked on you. See what the attacker does next →
              </span>
              <span className="block text-xs text-ink-muted">A 60-second walkthrough of the aftermath.</span>
            </span>
          </Link>
        )}

        <button
          type="button"
          onClick={onNext}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] transition hover:brightness-110"
        >
          {isLast ? "See round summary" : "Next"}
          <ArrowRight size={14} aria-hidden />
          <kbd className="rounded border border-white/40 px-1.5 text-[10px] font-normal">Enter</kbd>
        </button>
      </div>
    </motion.section>
  );
}

function missedCredHarvest(s: Scenario): boolean {
  const tags = s.techniqueTags ?? [];
  return (
    tags.includes("credential_harvest_link") ||
    tags.includes("fake_login_page") ||
    tags.includes("otp_theft") ||
    tags.includes("smishing_link") ||
    tags.includes("qr_redirect")
  );
}

function aftermathFor(s: Scenario): string {
  const tags = s.techniqueTags ?? [];
  if (tags.includes("payment_fraud")) return "bank";
  return "work-email";
}
