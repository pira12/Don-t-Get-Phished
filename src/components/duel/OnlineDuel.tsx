"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Bot, X, Trophy, Frown, Minus, RefreshCw, Home, CheckCircle2, XCircle, Wifi } from "lucide-react";
import { useOnlineDuel } from "@/hooks/useOnlineDuel";
import type { DuelConfig } from "@/game/duel";
import { DuelStage } from "./DuelStage";

/**
 * Real-time online duel: matchmaking → live race → result. Offline-first: if no
 * human is found, the player can drop to the always-available bot (onPlayBot).
 */
export function OnlineDuel({
  you,
  size,
  difficulty,
  onPlayBot,
  onExit,
}: {
  you: string;
  size: number;
  difficulty: DuelConfig["difficulty"];
  onPlayBot: () => void;
  onExit: () => void;
}) {
  const duel = useOnlineDuel();
  const [waited, setWaited] = useState(0);

  // Kick off matchmaking once.
  useEffect(() => {
    void duel.start(size, difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count how long we've been queueing (to offer the bot fallback).
  useEffect(() => {
    if (duel.phase !== "queueing") {
      setWaited(0);
      return;
    }
    const id = window.setInterval(() => setWaited((w) => w + 1), 1000);
    return () => window.clearInterval(id);
  }, [duel.phase]);

  if (duel.phase === "error") {
    return (
      <Centered>
        <p className="mb-3 text-sm text-danger">{duel.error || "Couldn't reach matchmaking."}</p>
        <div className="flex justify-center gap-2">
          <Btn onClick={onPlayBot} icon={<Bot size={15} />}>Play a bot instead</Btn>
          <Btn onClick={onExit} variant="ghost">Back</Btn>
        </div>
      </Centered>
    );
  }

  if (duel.phase === "queueing") {
    return (
      <Centered>
        <Loader2 className="mx-auto mb-3 animate-spin text-accent" />
        <h2 className="mb-1 text-lg font-semibold text-ink">Finding an opponent…</h2>
        <p className="mb-4 text-sm text-ink-muted">
          Matching you with another player ({size} emails, {difficulty}). {waited}s
        </p>
        <div className="flex justify-center gap-2">
          {waited >= 6 && (
            <Btn onClick={() => { void duel.cancel().then(onPlayBot); }} icon={<Bot size={15} />}>
              Play a bot instead
            </Btn>
          )}
          <Btn onClick={() => { void duel.cancel().then(onExit); }} variant="ghost" icon={<X size={15} />}>
            Cancel
          </Btn>
        </div>
      </Centered>
    );
  }

  if (duel.phase === "finished") {
    return <OnlineResult duel={duel} onRematch={() => duel.start(size, difficulty)} onExit={onExit} />;
  }

  // active
  const email = duel.deck[duel.localIndex];
  const oppName = duel.view?.opponent?.name ?? "Opponent";

  if (duel.iFinishedAnswering || !email) {
    const oppIdx = duel.view?.opponent?.index ?? 0;
    return (
      <Centered>
        <Wifi className="mx-auto mb-3 text-success" />
        <h2 className="mb-1 text-lg font-semibold text-ink">You&apos;re done!</h2>
        <p className="mb-2 text-sm text-ink-muted">Waiting for {oppName} to finish…</p>
        <div className="mx-auto mb-4 h-2 w-64 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(oppIdx / (duel.config?.size || 1)) * 100}%` }} />
        </div>
        <p className="text-xs text-ink-faint">
          Your score {duel.view?.you.score ?? 0} · {oppName} {duel.view?.opponent?.score ?? 0}
        </p>
        <div className="mt-4">
          <Btn onClick={() => void duel.forfeitClaim()} variant="ghost">
            Opponent left? Claim the win
          </Btn>
        </div>
      </Centered>
    );
  }

  return (
    <DuelStage
      email={email}
      you={you}
      opponentName={oppName}
      playerScore={duel.view?.you.score ?? 0}
      opponentScore={duel.view?.opponent?.score ?? 0}
      playerProgress={duel.localIndex / duel.deck.length}
      opponentProgress={(duel.view?.opponent?.index ?? 0) / duel.deck.length}
      total={duel.deck.length}
      emailNumber={duel.localIndex + 1}
      onAnswer={(v, ms) => void duel.answer(v, ms)}
    />
  );
}

function OnlineResult({
  duel,
  onRematch,
  onExit,
}: {
  duel: ReturnType<typeof useOnlineDuel>;
  onRematch: () => void;
  onExit: () => void;
}) {
  const v = duel.view;
  const won = v?.youWon;
  const banner =
    won === true
      ? { icon: <Trophy className="text-success" />, text: "You win!", cls: "bg-success-soft text-success" }
      : won === false
        ? { icon: <Frown className="text-danger" />, text: "You lost", cls: "bg-danger-soft text-danger" }
        : { icon: <Minus className="text-ink-muted" />, text: "Draw", cls: "bg-surface-2 text-ink" };

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-5 overflow-y-auto p-4 md:p-8 thin-scroll">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-surface p-6">
        <div className={["flex items-center gap-3 rounded-xl px-4 py-3", banner.cls].join(" ")}>
          {banner.icon}
          <span className="text-lg font-bold">{banner.text}</span>
          <span className="ml-auto text-sm font-medium">
            {v?.you.score ?? 0} · {v?.opponent?.score ?? 0}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-ink-muted">
            vs <strong className="text-ink">{v?.opponent?.name ?? "Opponent"}</strong> · online
          </span>
          {typeof v?.ratingAfter === "number" && (
            <span className="text-ink-muted">
              Rating <strong className="text-ink">{v.ratingAfter}</strong>{" "}
              <span className={(v.ratingDelta ?? 0) >= 0 ? "text-success" : "text-danger"}>
                ({(v.ratingDelta ?? 0) >= 0 ? "+" : ""}
                {v.ratingDelta})
              </span>
            </span>
          )}
        </div>
      </motion.div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Your calls this match</h2>
        <ul className="flex flex-col divide-y divide-border">
          {duel.deck.map((email, i) => {
            const m = duel.moves[i];
            return (
              <li key={email.id} className="flex items-start gap-3 py-2.5">
                {m ? (
                  m.correct ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-danger" />
                ) : (
                  <span className="mt-0.5 text-ink-faint">—</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink">{email.subject}</div>
                  <div className="text-xs text-ink-faint">truth: {email.truth}{m ? ` · you said ${m.verdict}` : ""}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3 pb-4">
        <Btn onClick={onRematch} icon={<RefreshCw size={15} />} variant="primary">Find another match</Btn>
        <Btn onClick={onExit} variant="ghost">New settings</Btn>
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-[var(--row-hover)]">
          <Home size={15} /> Inbox
        </Link>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center">{children}</div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  icon,
  variant = "surface",
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: "primary" | "surface" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? "bg-accent text-[color:var(--accent-ink)] hover:brightness-110"
      : variant === "ghost"
        ? "border border-border text-ink hover:bg-[var(--row-hover)]"
        : "border border-border bg-surface-2 text-ink hover:brightness-95";
  return (
    <button onClick={onClick} className={["inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold", cls].join(" ")}>
      {icon}
      {children}
    </button>
  );
}
