"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { UseDuel } from "@/hooks/useDuel";
import type { Verdict } from "@/game/types";
import { DuelStage } from "./DuelStage";

/** Bot duel: opponent progress/score are derived from the wall clock against the
 * precomputed bot run, then handed to the shared DuelStage. */
export function DuelArena({ duel, you }: { duel: UseDuel; you: string }) {
  const { deck, index, playerMoves, playerScore, botCumulativeMs, botMoves } = duel;
  const email = deck[index];

  const [now, setNow] = useState(() => Date.now());
  const arenaStartRef = useRef<number>(Date.now());

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

  if (!email) return null;

  return (
    <DuelStage
      email={email}
      you={you}
      opponentName={duel.opponentName}
      playerScore={playerScore}
      opponentScore={liveBotScore}
      playerProgress={playerMoves.length / deck.length}
      opponentProgress={Math.min(botIndex, deck.length) / deck.length}
      total={deck.length}
      emailNumber={index + 1}
      onAnswer={(v: Verdict, elapsedMs: number) => duel.answer(v, elapsedMs)}
    />
  );
}
