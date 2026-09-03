"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { EMAILS } from "@/data/emails";
import type { GameEmail, Verdict } from "@/game/types";
import {
  buildDuelDeck,
  simulateBot,
  duelPointsFor,
  duelOutcome,
  ratingDelta,
  type BotMove,
  type BotSkill,
  type DuelConfig,
} from "@/game/duel";
import { store } from "@/game/store";

export type PlayerMove = {
  verdict: Verdict;
  correct: boolean;
  elapsedMs: number;
  points: number;
};

export type DuelPhase = "lobby" | "playing" | "result";

export function useDuel() {
  const [phase, setPhase] = useState<DuelPhase>("lobby");
  const [config, setConfig] = useState<DuelConfig | null>(null);
  const [botSkill, setBotSkill] = useState<BotSkill>("analyst");
  const [opponentName, setOpponentName] = useState("Analyst bot");
  const [deck, setDeck] = useState<GameEmail[]>([]);
  const [botMoves, setBotMoves] = useState<BotMove[]>([]);
  const [index, setIndex] = useState(0);
  const [playerMoves, setPlayerMoves] = useState<PlayerMove[]>([]);
  const [duelState, setDuelState] = useState(() => store.loadDuelState());

  const emailStartRef = useRef<number>(0);
  const recordedRef = useRef(false);

  /** Cumulative bot completion times — powers the live "opponent progress" bar. */
  const botCumulativeMs = useMemo(() => {
    const out: number[] = [];
    let acc = 0;
    for (const m of botMoves) {
      acc += m.elapsedMs;
      out.push(acc);
    }
    return out;
  }, [botMoves]);

  const start = useCallback(
    (cfg: DuelConfig, skill: BotSkill, name: string) => {
      const d = buildDuelDeck(EMAILS, cfg);
      setConfig(cfg);
      setBotSkill(skill);
      setOpponentName(name);
      setDeck(d);
      setBotMoves(simulateBot(d, skill, cfg.seed));
      setIndex(0);
      setPlayerMoves([]);
      setPhase("playing");
      recordedRef.current = false;
      emailStartRef.current = Date.now();
    },
    [],
  );

  const answer = useCallback(
    (verdict: Verdict, elapsedMsArg?: number) => {
      setPlayerMoves((prev) => {
        if (prev.length !== index) return prev; // guard against double-answer
        const email = deck[index];
        if (!email) return prev;
        const elapsedMs = elapsedMsArg ?? Date.now() - emailStartRef.current;
        const correct = verdict === email.truth;
        const move: PlayerMove = { verdict, correct, elapsedMs, points: duelPointsFor(correct, elapsedMs) };
        const next = [...prev, move];

        if (next.length >= deck.length) {
          setPhase("result");
        } else {
          setIndex(next.length);
          emailStartRef.current = Date.now();
        }
        return next;
      });
    },
    [deck, index],
  );

  const playerScore = useMemo(
    () => playerMoves.reduce((s, m) => s + m.points, 0),
    [playerMoves],
  );
  const botScore = useMemo(() => botMoves.reduce((s, m) => s + m.points, 0), [botMoves]);

  const outcome = useMemo(() => duelOutcome(playerScore, botScore), [playerScore, botScore]);

  /** Persist rating + history exactly once when the result screen is reached. */
  const commitResult = useCallback(() => {
    if (recordedRef.current || phase !== "result") return;
    recordedRef.current = true;
    const delta = ratingDelta(outcome);
    setDuelState((prev) => {
      const next = {
        rating: Math.max(0, prev.rating + delta),
        wins: prev.wins + (outcome === "win" ? 1 : 0),
        losses: prev.losses + (outcome === "loss" ? 1 : 0),
        draws: prev.draws + (outcome === "draw" ? 1 : 0),
        history: [
          {
            at: new Date().toISOString(),
            outcome,
            playerScore,
            opponentScore: botScore,
            opponent: opponentName,
            ratingAfter: Math.max(0, prev.rating + delta),
          },
          ...prev.history,
        ].slice(0, 10),
      };
      store.saveDuelState(next);
      return next;
    });
  }, [outcome, phase, playerScore, botScore, opponentName]);

  const reset = useCallback(() => {
    setPhase("lobby");
    setPlayerMoves([]);
    setIndex(0);
  }, []);

  return {
    phase,
    config,
    botSkill,
    opponentName,
    deck,
    botMoves,
    botCumulativeMs,
    index,
    playerMoves,
    playerScore,
    botScore,
    outcome,
    duelState,
    ratingDeltaValue: ratingDelta(outcome),
    start,
    answer,
    commitResult,
    reset,
    setEmailStart: () => (emailStartRef.current = Date.now()),
  };
}

export type UseDuel = ReturnType<typeof useDuel>;
