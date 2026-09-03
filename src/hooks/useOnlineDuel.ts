"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EMAILS } from "@/data/emails";
import { api, type DuelMatchView } from "@/net/api";
import { buildDuelDeck, duelPointsFor, type DuelConfig } from "@/game/duel";
import type { GameEmail, Verdict } from "@/game/types";

export type OnlinePhase = "idle" | "queueing" | "active" | "finished" | "error";

export type OnlineMove = { verdict: Verdict; correct: boolean; elapsedMs: number; points: number };

export function useOnlineDuel() {
  const [phase, setPhase] = useState<OnlinePhase>("idle");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [config, setConfig] = useState<DuelConfig | null>(null);
  const [deck, setDeck] = useState<GameEmail[]>([]);
  const [localIndex, setLocalIndex] = useState(0);
  const [moves, setMoves] = useState<OnlineMove[]>([]);
  const [view, setView] = useState<DuelMatchView | null>(null);
  const [error, setError] = useState("");
  const [myRating, setMyRating] = useState(1000);

  const matchIdRef = useRef<string | null>(null);
  matchIdRef.current = matchId;

  const start = useCallback(async (size: number, difficulty: DuelConfig["difficulty"]) => {
    setError("");
    setMoves([]);
    setLocalIndex(0);
    setView(null);
    try {
      const r = await api.duelQueue(size, difficulty);
      const cfg: DuelConfig = { seed: r.seed, size: r.size, difficulty: r.difficulty };
      setConfig(cfg);
      setDeck(buildDuelDeck(EMAILS, cfg));
      setMatchId(r.matchId);
      setMyRating(r.rating);
      setPhase(r.status === "active" ? "active" : "queueing");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }, []);

  // Poll for match state while queueing (waiting for an opponent) or active.
  useEffect(() => {
    if ((phase !== "queueing" && phase !== "active") || !matchId) return;
    let alive = true;
    const tick = async () => {
      try {
        const v = await api.duelMatch(matchId);
        if (!alive) return;
        setView(v);
        if (phase === "queueing" && v.status === "active") setPhase("active");
        if (v.status === "finished") setPhase("finished");
      } catch {
        /* transient */
      }
    };
    void tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [phase, matchId]);

  const answer = useCallback(
    async (verdict: Verdict, elapsedMs: number) => {
      const id = matchIdRef.current;
      if (!id) return;
      setLocalIndex((idx) => {
        const email = deck[idx];
        if (!email || idx >= deck.length) return idx;
        const correct = verdict === email.truth;
        setMoves((prev) => [...prev, { verdict, correct, elapsedMs, points: duelPointsFor(correct, elapsedMs) }]);
        void api
          .duelAnswer(id, correct, elapsedMs)
          .then((v) => {
            setView(v);
            if (v.status === "finished") setPhase("finished");
          })
          .catch(() => {});
        return idx + 1;
      });
    },
    [deck],
  );

  const cancel = useCallback(async () => {
    const id = matchIdRef.current;
    if (id && phase === "queueing") {
      try {
        await api.duelCancel(id);
      } catch {
        /* ignore */
      }
    }
    setPhase("idle");
    setMatchId(null);
  }, [phase]);

  const forfeitClaim = useCallback(async () => {
    const id = matchIdRef.current;
    if (!id) return;
    try {
      const v = await api.duelForfeit(id);
      setView(v);
      if (v.status === "finished") setPhase("finished");
    } catch {
      /* opponent still connected */
    }
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setMatchId(null);
    setView(null);
    setDeck([]);
    setLocalIndex(0);
    setMoves([]);
  }, []);

  const iFinishedAnswering = deck.length > 0 && localIndex >= deck.length;

  return {
    phase,
    config,
    deck,
    localIndex,
    moves,
    view,
    error,
    myRating,
    iFinishedAnswering,
    start,
    answer,
    cancel,
    forfeitClaim,
    reset,
  };
}

export type UseOnlineDuel = ReturnType<typeof useOnlineDuel>;
