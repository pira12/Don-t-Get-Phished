"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { UseDuel } from "@/hooks/useDuel";
import type { ToolName } from "@/hooks/useGame";
import type { Verdict } from "@/game/types";
import { EmailMessage } from "@/components/EmailMessage";
import { LinkStatusBar } from "@/components/LinkStatusBar";
import { DuelBar } from "./DuelBar";

export function DuelArena({ duel, you }: { duel: UseDuel; you: string }) {
  const { deck, index, playerMoves, playerScore, botCumulativeMs, botMoves } = duel;
  const email = deck[index];

  const [showSender, setShowSender] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [hoverHref, setHoverHref] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const arenaStartRef = useRef<number>(Date.now());
  const emailStartRef = useRef<number>(Date.now());

  // Reset tool panels + per-email timer when the email changes.
  useEffect(() => {
    setShowSender(false);
    setShowHeaders(false);
    setHoverHref(null);
    emailStartRef.current = Date.now();
  }, [index]);

  // Wall-clock tick drives the live opponent race.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, []);

  const botElapsed = now - arenaStartRef.current;
  const botIndex = useMemo(
    () => botCumulativeMs.filter((t) => t <= botElapsed).length,
    [botCumulativeMs, botElapsed],
  );
  const liveBotScore = useMemo(
    () => botMoves.slice(0, botIndex).reduce((s, m) => s + m.points, 0),
    [botMoves, botIndex],
  );

  const secondsOnEmail = Math.floor((now - emailStartRef.current) / 1000);

  const onTool = (_t: ToolName) => {
    /* tool usage during a duel is for the player's benefit; no scoring hook */
  };

  const answer = (v: Verdict) => duel.answer(v);

  // Keyboard: P / L.
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
  }, [index, deck]);

  if (!email) return null;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-surface">
      <DuelBar
        you={you}
        opponentName={duel.opponentName}
        playerScore={playerScore}
        botScore={liveBotScore}
        playerProgress={playerMoves.length / deck.length}
        botProgress={Math.min(botIndex, deck.length) / deck.length}
        total={deck.length}
        emailNumber={index + 1}
        secondsOnEmail={secondsOnEmail}
      />

      <div className="min-h-0 flex-1">
        <EmailMessage
          key={email.id}
          email={email}
          onTool={onTool}
          onHoverLink={setHoverHref}
          showSender={showSender}
          setShowSender={setShowSender}
          showHeaders={showHeaders}
          setShowHeaders={setShowHeaders}
          showReplyActions={false}
        />
      </div>

      {/* Duel classification — decide fast, decide right. */}
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
