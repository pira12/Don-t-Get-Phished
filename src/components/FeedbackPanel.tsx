"use client";

import { CheckCircle2, XCircle, ArrowRight, Search } from "lucide-react";
import { motion } from "framer-motion";
import type { GameEmail, RedFlag } from "@/game/types";
import { TECHNIQUE_LABELS } from "@/game/types";
import type { AnswerResult } from "@/game/scoring";

export function FeedbackPanel({
  email,
  result,
  isLast,
  onJump,
  onNext,
}: {
  email: GameEmail;
  result: AnswerResult;
  isLast: boolean;
  onJump: (flag: RedFlag) => void;
  onNext: () => void;
}) {
  const correct = result.correct;
  const truthLabel = email.truth === "phishing" ? "Phishing" : "Legitimate";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      aria-label="Feedback"
      className="border-t-2 border-border bg-surface-2"
    >
      <div
        className={[
          "flex items-center gap-3 px-4 py-3 md:px-6",
          correct ? "bg-success-soft" : "bg-danger-soft",
        ].join(" ")}
      >
        {correct ? (
          <CheckCircle2 className="text-success" aria-hidden />
        ) : (
          <XCircle className="text-danger" aria-hidden />
        )}
        <div className="flex-1">
          <p className={["font-semibold", correct ? "text-success" : "text-danger"].join(" ")}>
            {correct ? "Correct!" : "Not quite."}
          </p>
          <p className="text-sm text-ink-muted">
            This email was <strong>{truthLabel}</strong>.
            {!correct && result.falsePositive && " You over-flagged a safe message (a false positive)."}
            {!correct && result.falseNegative && " You missed a phishing attempt (a false negative)."}
          </p>
        </div>
        {correct && (
          <div className="text-right">
            <div className="text-lg font-bold text-success">+{result.points}</div>
            <div className="text-[11px] text-ink-muted">streak ×{result.newStreak}</div>
          </div>
        )}
      </div>

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
