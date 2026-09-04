"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, Search, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import type { GameEmail, RedFlag } from "@/game/types";
import { TECHNIQUE_LABELS } from "@/game/types";
import type { AnswerResult, MailAction } from "@/game/scoring";

export function FeedbackPanel({
  email,
  result,
  action,
  isLast,
  onJump,
  onNext,
}: {
  email: GameEmail;
  result: AnswerResult;
  action: MailAction;
  isLast: boolean;
  onJump: (flag: RedFlag) => void;
  onNext: () => void;
}) {
  const correct = result.correct;
  const truthLabel = email.truth === "phishing" ? "Phishing" : "Legitimate";
  const note = actionNote(email.truth, action, result.quality);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      aria-label="Feedback"
      className="border-t-2 border-border bg-surface-2"
    >
      {(() => {
        const acceptable = correct && result.quality === "acceptable";
        const tone = !correct ? "danger" : acceptable ? "warning" : "success";
        const bg = tone === "danger" ? "bg-danger-soft" : tone === "warning" ? "bg-warning-soft" : "bg-success-soft";
        const fg = tone === "danger" ? "text-danger" : tone === "warning" ? "text-[color:var(--warning)]" : "text-success";
        const headline = !correct ? "Not quite." : acceptable ? "Good instinct — but not the best move." : "Correct!";
        return (
          <div className={["flex items-center gap-3 px-4 py-3 md:px-6", bg].join(" ")}>
            {correct ? (
              <CheckCircle2 className={fg} aria-hidden />
            ) : (
              <XCircle className="text-danger" aria-hidden />
            )}
            <div className="flex-1">
              <p className={["font-semibold", fg].join(" ")}>{headline}</p>
              <p className="text-sm text-ink-muted">
                This email was <strong>{truthLabel}</strong>. {note}
              </p>
            </div>
            {correct && (
              <div className="text-right">
                <div className={["text-lg font-bold", fg].join(" ")}>+{result.points}</div>
                <div className="text-[11px] text-ink-muted">streak ×{result.newStreak}</div>
              </div>
            )}
          </div>
        );
      })()}

      <div className="px-4 py-4 md:px-6">
        {email.truth === "phishing" ? (
          <>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <Search size={15} aria-hidden /> Red flags in this email
            </h3>
            <ul className="flex flex-col gap-2">
              {email.redFlags.map((flag, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => onJump(flag)}
                    className="group flex w-full items-start gap-2 rounded-client border border-border bg-surface px-3 py-2 text-left transition hover:border-accent"
                  >
                    <span className="mt-0.5 whitespace-nowrap rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                      {TECHNIQUE_LABELS[flag.type]}
                    </span>
                    <span className="flex-1 text-xs text-ink-muted">{flag.explanation}</span>
                    <ArrowRight
                      size={14}
                      className="mt-1 shrink-0 text-ink-faint transition group-hover:text-accent"
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-ink-faint">Tip: click a flag to jump to it in the email.</p>
          </>
        ) : (
          <>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <CheckCircle2 size={15} className="text-success" aria-hidden /> Why this one was safe
            </h3>
            <ul className="flex flex-col gap-1.5">
              {(email.legitSignals ?? []).map((sig, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-success" aria-hidden />
                  {sig}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Missed a credential-harvest phish? Show the real-world cost from the
            attacker's side — the most memorable teaching moment. */}
        {!correct && email.truth === "phishing" && missedCredHarvest(email) && (
          <Link
            href={`/aftermath?scenario=${aftermathScenarioFor(email)}`}
            className="mt-3 flex items-center gap-3 rounded-client border border-danger/40 bg-danger-soft px-3 py-2.5 text-left transition hover:brightness-95"
          >
            <ShieldAlert size={20} className="shrink-0 text-danger" aria-hidden />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-danger">
                You would have clicked. See what a real attacker does next →
              </span>
              <span className="block text-xs text-ink-muted">
                A 60-second walkthrough of the aftermath — and how one habit stops all of it.
              </span>
            </span>
          </Link>
        )}

        <button
          type="button"
          onClick={onNext}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] transition hover:brightness-110"
        >
          {isLast ? "See round summary" : "Next email"}
          <kbd className="rounded border border-white/40 px-1.5 text-[10px] font-normal">Enter</kbd>
        </button>
      </div>
    </motion.section>
  );
}

/** Coaching sentence that teaches the ideal real-world action. */
function actionNote(truth: GameEmail["truth"], action: MailAction, quality?: AnswerResult["quality"]): string {
  if (truth === "phishing") {
    if (action === "report") return "You reported it — exactly right. That removes the threat and helps filters protect everyone else.";
    if (action === "delete") return "Right instinct, but you only deleted it. Reporting phishing is better — it trains the filters and warns your team. (Half points.)";
    return "You archived a phishing email — it would have stayed in your inbox, looking trusted. Report phishing instead.";
  }
  // legit
  if (action === "archive") return "You kept it — correct. It's a genuine message, so leaving it in your inbox is right.";
  if (action === "delete") return "This was a real message. Deleting works, but you could have kept it. (Half points.)";
  return "You reported a legitimate email. Over-reporting buries real mail and erodes trust in the report button.";
}

/** Would clicking this have led to a credential-entry page? */
function missedCredHarvest(email: GameEmail): boolean {
  const tags = email.techniqueTags ?? [];
  return tags.includes("credential_harvest_link") || tags.includes("lookalike_domain") || tags.includes("attachment_lure");
}

/** Pick the aftermath scenario that best fits the email's pretext. */
function aftermathScenarioFor(email: GameEmail): string {
  const hay = `${email.subject} ${email.from.name} ${email.from.address}`.toLowerCase();
  if (/(bank|payment|card|invoice|transaction|billing|salary|payroll|deposit)/.test(hay)) return "bank";
  return "work-email";
}
