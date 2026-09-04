"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ALL_SCENARIOS, scenariosForChannel } from "@/data/scenarios";
import { evaluateAction, type AnswerResult, type MailAction } from "@/game/scoring";
import { buildScenarioRound, buildMixedRound } from "@/game/rounds";
import { levelForXp, tierForLevel } from "@/game/xp";
import { EMPTY_STATS, updateDailyStreak, type LifetimeStats } from "@/game/storage";
import { store } from "@/game/store";
import type { Channel, GameEmail, RedFlagType, Scenario } from "@/game/types";

const loadStats = () => store.loadStats();
const saveStats = (s: LifetimeStats) => store.saveStats(s);

export type ScenarioMode = { kind: "channel"; channel: Exclude<Channel, "email"> } | { kind: "mixed" };

export type ScenarioFeedback = { scenario: Scenario; action: MailAction; result: AnswerResult };

type State = {
  deck: Scenario[];
  index: number;
  answered: Record<string, ScenarioFeedback>;
  roundScore: number;
  streak: number;
  phase: "playing" | "summary";
  mode: ScenarioMode;
};

const DEFAULT_SIZE = 8;

/**
 * The play loop for the non-email channels (SMS / call / chat / web) and the mixed
 * cross-channel round. Reuses the exact same scoring, XP and lifetime-stats
 * pipeline as the email inbox, so progress is one shared profile.
 */
export function useScenarioGame(initial: ScenarioMode) {
  const [stats, setStats] = useState<LifetimeStats>(EMPTY_STATS);
  const [state, setState] = useState<State>(() => ({
    deck: [],
    index: 0,
    answered: {},
    roundScore: 0,
    streak: 0,
    phase: "playing",
    mode: initial,
  }));

  const startedAtRef = useRef<number>(Date.now());
  const investigatedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setStats({ ...loadStats() });
  }, []);

  const start = useCallback((mode: ScenarioMode) => {
    const avoidIds = loadStats().answeredIds;
    const deck =
      mode.kind === "mixed"
        ? buildMixedRound(
            (["sms", "call", "chat", "web"] as const).map((c) => scenariosForChannel(c)),
            { size: 10, avoidIds },
          )
        : buildScenarioRound(scenariosForChannel(mode.channel), { size: DEFAULT_SIZE, avoidIds });
    setState({ deck, index: 0, answered: {}, roundScore: 0, streak: 0, phase: "playing", mode });
    startedAtRef.current = Date.now();
    investigatedRef.current = new Set();
  }, []);

  // Auto-start on mount.
  useEffect(() => {
    start(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = state.deck[state.index];
  const currentFeedback = current ? state.answered[current.id] : undefined;

  const recordInvestigate = useCallback((tool: string) => {
    investigatedRef.current.add(tool);
  }, []);

  const answer = useCallback(
    (action: MailAction): AnswerResult | undefined => {
      const scenario = state.deck[state.index];
      if (!scenario || state.answered[scenario.id]) return undefined;

      const elapsedMs = Date.now() - startedAtRef.current;
      const result = evaluateAction({
        // evaluateAction only reads truth + difficulty, shared by every scenario.
        email: scenario as unknown as GameEmail,
        action,
        elapsedMs,
        toolsUsed: investigatedRef.current.size,
        currentStreak: state.streak,
      });

      setState((s) => ({
        ...s,
        answered: { ...s.answered, [scenario.id]: { scenario, action, result } },
        roundScore: s.roundScore + result.points,
        streak: result.newStreak,
      }));

      setStats((prev) => {
        const next: LifetimeStats = {
          ...prev,
          techniqueSeen: { ...prev.techniqueSeen },
          techniqueCaught: { ...prev.techniqueCaught },
          answeredIds: [...prev.answeredIds],
        };
        next.totalAnswered += 1;
        next.xp += result.xp;
        if (result.correct) next.totalCorrect += 1;
        if (result.falsePositive) next.falsePositives += 1;
        if (result.falseNegative) next.falseNegatives += 1;
        next.bestStreak = Math.max(next.bestStreak, result.newStreak);
        next.cleanRunNoFalsePositive = result.falsePositive ? 0 : next.cleanRunNoFalsePositive + 1;

        const tags = (scenario.techniqueTags ?? []) as RedFlagType[];
        for (const t of tags) {
          next.techniqueSeen[t] = (next.techniqueSeen[t] ?? 0) + 1;
          if (result.correct && scenario.truth === "phishing") {
            next.techniqueCaught[t] = (next.techniqueCaught[t] ?? 0) + 1;
          }
        }
        if (!next.answeredIds.includes(scenario.id)) {
          next.answeredIds = [scenario.id, ...next.answeredIds].slice(0, 30);
        }
        saveStats(next);
        return next;
      });

      return result;
    },
    [state],
  );

  const next = useCallback(() => {
    setState((s) => {
      const nextIndex = s.index + 1;
      if (nextIndex >= s.deck.length) return { ...s, phase: "summary" };
      return { ...s, index: nextIndex };
    });
    startedAtRef.current = Date.now();
    investigatedRef.current = new Set();
  }, []);

  const finalizeRound = useCallback(() => {
    setState((s) => {
      const answers = Object.values(s.answered);
      if (answers.length > 0) {
        setStats((prev) => {
          let n: LifetimeStats = { ...prev, roundsPlayed: prev.roundsPlayed + 1 };
          n = updateDailyStreak(n);
          saveStats(n);
          return n;
        });
      }
      return s;
    });
  }, []);

  const level = useMemo(() => levelForXp(stats.xp), [stats.xp]);
  const tier = useMemo(() => tierForLevel(level.level), [level.level]);
  const answeredCount = Object.keys(state.answered).length;

  return {
    deck: state.deck,
    index: state.index,
    phase: state.phase,
    mode: state.mode,
    current,
    currentFeedback,
    answered: state.answered,
    answeredCount,
    roundScore: state.roundScore,
    streak: state.streak,
    stats,
    level,
    tier,
    start,
    answer,
    next,
    finalizeRound,
    recordInvestigate,
  };
}

export type UseScenarioGame = ReturnType<typeof useScenarioGame>;

/** Total scenarios available across all non-email channels (for copy/labels). */
export const TOTAL_SCENARIOS = ALL_SCENARIOS.length;
