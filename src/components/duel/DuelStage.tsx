"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { GameEmail, Verdict } from "@/game/types";
import { EmailMessage } from "@/components/EmailMessage";
import { LinkStatusBar } from "@/components/LinkStatusBar";
import { DuelBar } from "./DuelBar";

/**
 * The shared duel arena: the realistic email + forensic tools with the
 * competitive versus-bar around it. Timing lives here (one source of truth) and
 * is handed to `onAnswer`, so both the bot duel and the online duel reuse it.
 */
export function DuelStage({
  email,
  you,
  opponentName,
  playerScore,
  opponentScore,
  playerProgress,
  opponentProgress,
  total,
  emailNumber,
  onAnswer,
}: {
  email: GameEmail;
  you: string;
  opponentName: string;
  playerScore: number;
  opponentScore: number;
  playerProgress: number;
  opponentProgress: number;
  total: number;
  emailNumber: number;
  onAnswer: (verdict: Verdict, elapsedMs: number) => void;
}) {
  const [showSender, setShowSender] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [hoverHref, setHoverHref] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const emailStartRef = useRef<number>(Date.now());

  useEffect(() => {
    setShowSender(false);
    setShowHeaders(false);
    setHoverHref(null);
    emailStartRef.current = Date.now();
  }, [email.id]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);

  const answer = (v: Verdict) => onAnswer(v, Date.now() - emailStartRef.current);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        answer("phishing");
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        answer("legit");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email.id]);

  const secondsOnEmail = Math.floor((now - emailStartRef.current) / 1000);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-surface">
      <DuelBar
        you={you}
        opponentName={opponentName}
        playerScore={playerScore}
        botScore={opponentScore}
        playerProgress={playerProgress}
        botProgress={opponentProgress}
        total={total}
        emailNumber={emailNumber}
        secondsOnEmail={secondsOnEmail}
      />

      <div className="min-h-0 flex-1">
        <EmailMessage
          key={email.id}
          email={email}
          onTool={() => {}}
          onHoverLink={setHoverHref}
          showSender={showSender}
          setShowSender={setShowSender}
          showHeaders={showHeaders}
          setShowHeaders={setShowHeaders}
          showReplyActions={false}
        />
      </div>

      <div className="flex items-center gap-3 border-t border-border bg-surface px-4 py-3">
        <span className="mr-1 text-xs font-medium text-ink-muted">Quick — verdict:</span>
        <button
          type="button"
          onClick={() => answer("phishing")}
          className="inline-flex items-center gap-2 rounded-full border border-danger/50 bg-danger-soft px-4 py-2 text-sm font-semibold text-danger transition hover:brightness-95"
        >
          <ShieldAlert size={16} /> Phishing <kbd className="ml-1 rounded border border-danger/40 px-1.5 text-[10px] font-normal">P</kbd>
        </button>
        <button
          type="button"
          onClick={() => answer("legit")}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95"
        >
          <ShieldCheck size={16} /> Legit <kbd className="ml-1 rounded border border-border px-1.5 text-[10px] font-normal">L</kbd>
        </button>
        <span className="ml-auto text-[11px] text-ink-faint">A wrong call costs you — accuracy first.</span>
      </div>

      <LinkStatusBar href={hoverHref} />
    </div>
  );
}
