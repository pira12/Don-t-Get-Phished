"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Shuffle, ArrowRight, Trophy, Target } from "lucide-react";
import { useScenarioGame, type ScenarioMode } from "@/hooks/useScenarioGame";
import { CHANNELS, CHANNEL_ORDER } from "@/game/channels";
import type { Channel } from "@/game/types";
import { ChannelIcon } from "./icons";
import { ScenarioActionBar } from "./ScenarioActionBar";
import { ScenarioFeedback } from "./ScenarioFeedback";
import { SmsThread, CallScreen, ChatThread, WebBrowser } from "./Surfaces";

const NON_EMAIL = CHANNEL_ORDER.filter((c) => c !== "email") as Exclude<Channel, "email">[];

export function ScenarioArena({ initial }: { initial: ScenarioMode }) {
  const game = useScenarioGame(initial);
  const { current, currentFeedback, phase } = game;

  // Enter advances once a scenario has been answered.
  useEffect(() => {
    if (!currentFeedback) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        game.next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentFeedback, game]);

  const modeLabel =
    game.mode.kind === "mixed" ? "Mixed — all channels" : CHANNELS[game.mode.channel].label;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 py-5 md:px-5">
      {/* mode picker */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-ink-faint">Channel:</span>
        {NON_EMAIL.map((c) => {
          const active = game.mode.kind === "channel" && game.mode.channel === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => game.start({ kind: "channel", channel: c })}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active ? "border-accent bg-accent-soft text-accent" : "border-border text-ink-muted hover:border-accent",
              ].join(" ")}
            >
              <ChannelIcon name={CHANNELS[c].icon} size={13} /> {CHANNELS[c].label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => game.start({ kind: "mixed" })}
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
            game.mode.kind === "mixed" ? "border-accent bg-accent-soft text-accent" : "border-border text-ink-muted hover:border-accent",
          ].join(" ")}
        >
          <Shuffle size={13} /> Mixed
        </button>
        <Link
          href="/"
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-ink-muted hover:border-accent"
        >
          <ChannelIcon name="Mail" size={13} /> Email inbox
        </Link>
      </div>

      {/* progress */}
      {phase === "playing" && current && (
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>
            {modeLabel} · {game.index + 1} of {game.deck.length}
          </span>
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Target size={13} /> {game.roundScore} pts
            </span>
            <span>streak ×{game.streak}</span>
          </span>
        </div>
      )}

      {/* card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-canvas">
        {phase === "summary" ? (
          <Summary game={game} />
        ) : current ? (
          <>
            <div className="border-b border-border bg-surface px-4 py-2.5 md:px-6">
              <div className="flex items-center gap-2 text-[12px] font-medium text-ink-muted">
                <ChannelIcon name={CHANNELS[current.channel].icon} size={14} />
                {CHANNELS[current.channel].surface}
              </div>
            </div>

            <div className="min-h-[300px] bg-canvas">
              {current.channel === "sms" && <SmsThread s={current} onInvestigate={game.recordInvestigate} />}
              {current.channel === "call" && <CallScreen s={current} onInvestigate={game.recordInvestigate} />}
              {current.channel === "chat" && <ChatThread s={current} onInvestigate={game.recordInvestigate} />}
              {current.channel === "web" && <WebBrowser s={current} onInvestigate={game.recordInvestigate} />}
            </div>

            {currentFeedback ? (
              <ScenarioFeedback
                scenario={currentFeedback.scenario}
                result={currentFeedback.result}
                action={currentFeedback.action}
                isLast={game.index === game.deck.length - 1}
                onNext={game.next}
              />
            ) : (
              <ScenarioActionBar channel={current.channel} onAction={(a) => game.answer(a)} disabled={false} />
            )}
          </>
        ) : (
          <div className="p-10 text-center text-sm text-ink-muted">Loading…</div>
        )}
      </div>
    </div>
  );
}

function Summary({ game }: { game: ReturnType<typeof useScenarioGame> }) {
  const answers = Object.values(game.answered);
  const correct = answers.filter((a) => a.result.correct).length;
  const total = answers.length;
  const acc = total ? Math.round((correct / total) * 100) : 0;

  // Roll up round-level stats once when the summary shows.
  useEffect(() => {
    game.finalizeRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="px-6 py-8 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Trophy size={26} />
      </div>
      <h2 className="text-xl font-semibold text-ink">Round complete</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {correct} / {total} correct · {acc}% accuracy · {game.roundScore} points
      </p>

      <div className="mx-auto mt-5 flex max-w-md flex-col gap-1.5 text-left">
        {answers.map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-client border border-border bg-surface px-3 py-1.5 text-xs"
          >
            <ChannelIcon name={CHANNELS[a.scenario.channel].icon} size={13} className="text-ink-muted" />
            <span className="flex-1 truncate text-ink">{a.scenario.title}</span>
            <span className={a.result.correct ? "text-success" : "text-danger"}>
              {a.result.correct ? "✓" : "✗"}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => game.start(game.mode)}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
        >
          <RotateCcw size={15} /> Play again
        </button>
        <button
          type="button"
          onClick={() => game.start({ kind: "mixed" })}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink hover:bg-[var(--row-hover)]"
        >
          <Shuffle size={15} /> Mixed round
        </button>
        <Link
          href="/stats"
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink-muted hover:bg-[var(--row-hover)]"
        >
          Your stats <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
