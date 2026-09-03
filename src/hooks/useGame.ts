"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EMAILS } from "@/data/emails";
import { evaluateAnswer, type AnswerResult } from "@/game/scoring";
import { buildRound, type RoundOptions } from "@/game/rounds";
import { levelForXp, tierForLevel } from "@/game/xp";
import { EMPTY_STATS, updateDailyStreak, type LifetimeStats } from "@/game/storage";
import { store } from "@/game/store";
import { buildDailyDeck, todayKey, type DailyResult } from "@/game/daily";
import type { GameEmail, RedFlagType, Verdict } from "@/game/types";

// Persistence flows through the GameStore seam (Phase 2 swaps it for an API).
const loadStats = () => store.loadStats();
const saveStats = (s: LifetimeStats) => store.saveStats(s);

export type ToolName =
  | "sender_details"
  | "headers"
  | "link_inspector"
  | "link_hover"
  | "attachment_inspector";

export type PerEmailFeedback = {
  email: GameEmail;
  verdict: Verdict;
  result: AnswerResult;
  usedHeaders: boolean;
};

export type RoundConfig = RoundOptions & { label?: string };

export type RoundMode = "practice" | "daily";

type GameState = {
  deck: GameEmail[];
  index: number;
  answered: Record<string, PerEmailFeedback>;
  roundScore: number;
  streak: number;
  phase: "playing" | "summary";
  mode: RoundMode;
};

const DEFAULT_SIZE = 10;

export function useGame() {
  // Start from EMPTY_STATS so the first client render matches the server-rendered
  // HTML (no localStorage on the server); the mount effect below hydrates the real
  // stats. Initialising from localStorage here would cause a hydration mismatch.
  const [stats, setStats] = useState<LifetimeStats>(EMPTY_STATS);
  const [config, setConfig] = useState<RoundConfig>({ size: DEFAULT_SIZE, difficulty: "easy" });
  const [state, setState] = useState<GameState>(() => ({
    deck: [],
    index: 0,
    answered: {},
    roundScore: 0,
    streak: 0,
    phase: "playing",
    mode: "practice",
  }));

  // Per-email investigation tracking (reset each time we move to a new email).
  const startedAtRef = useRef<number>(Date.now());
  const toolsThisEmailRef = useRef<Set<ToolName>>(new Set());

  // Published org-authored content, merged into practice rounds (not the daily
  // challenge, which stays globally deterministic).
  const orgPoolRef = useRef<GameEmail[]>([]);
  const setOrgContent = useCallback((emails: GameEmail[]) => {
    orgPoolRef.current = Array.isArray(emails) ? emails : [];
  }, []);

  // Hydrate persisted stats on mount (client only).
  useEffect(() => {
    setStats({ ...loadStats() });
  }, []);

  const startRound = useCallback((cfg?: RoundConfig) => {
    const merged: RoundConfig = { size: DEFAULT_SIZE, difficulty: "easy", ...cfg };
    const pool = orgPoolRef.current.length ? [...EMAILS, ...orgPoolRef.current] : EMAILS;
    const deck = buildRound(pool, { ...merged, avoidIds: loadStats().answeredIds });
    setConfig(merged);
    setState({
      deck,
      index: 0,
      answered: {},
      roundScore: 0,
      streak: 0,
      phase: "playing",
      mode: "practice",
    });
    startedAtRef.current = Date.now();
    toolsThisEmailRef.current = new Set();
  }, []);

  const startDaily = useCallback(() => {
    const deck = buildDailyDeck(EMAILS);
    setConfig({ size: deck.length, difficulty: "mixed", label: "Daily challenge" });
    setState({
      deck,
      index: 0,
      answered: {},
      roundScore: 0,
      streak: 0,
      phase: "playing",
      mode: "daily",
    });
    startedAtRef.current = Date.now();
    toolsThisEmailRef.current = new Set();
  }, []);

  // Auto-start a round on first mount.
  useEffect(() => {
    if (state.deck.length === 0) startRound(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentEmail: GameEmail | undefined = state.deck[state.index];
  const currentFeedback = currentEmail ? state.answered[currentEmail.id] : undefined;

  const recordTool = useCallback((tool: ToolName) => {
    toolsThisEmailRef.current.add(tool);
  }, []);

  const selectIndex = useCallback(
    (idx: number) => {
      setState((s) => {
        if (idx < 0 || idx >= s.deck.length) return s;
        return { ...s, index: idx };
      });
      startedAtRef.current = Date.now();
      toolsThisEmailRef.current = new Set();
    },
    [],
  );

  const answer = useCallback(
    (verdict: Verdict): AnswerResult | undefined => {
      const email = state.deck[state.index];
      if (!email || state.answered[email.id]) return undefined;

      const elapsedMs = Date.now() - startedAtRef.current;
      const tools = toolsThisEmailRef.current;
      const usedHeaders = tools.has("headers");

      const result = evaluateAnswer({
        email,
        verdict,
        elapsedMs,
        toolsUsed: tools.size,
        currentStreak: state.streak,
      });

      // Update round state.
      setState((s) => ({
        ...s,
        answered: {
          ...s.answered,
          [email.id]: { email, verdict, result, usedHeaders },
        },
        roundScore: s.roundScore + result.points,
        streak: result.newStreak,
      }));

      // Update lifetime stats.
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

        next.cleanRunNoFalsePositive = result.falsePositive
          ? 0
          : next.cleanRunNoFalsePositive + 1;

        // Technique attribution (for weakness heatmap + badges).
        const tags = (email.techniqueTags ?? []) as RedFlagType[];
        for (const t of tags) {
          next.techniqueSeen[t] = (next.techniqueSeen[t] ?? 0) + 1;
          if (result.correct && email.truth === "phishing") {
            next.techniqueCaught[t] = (next.techniqueCaught[t] ?? 0) + 1;
          }
        }

        // Quick-Draw badge tracking.
        if (
          result.correct &&
          email.truth === "phishing" &&
          tags.includes("reply_to_mismatch") &&
          elapsedMs < next.fastestReplyToCatchMs
        ) {
          next.fastestReplyToCatchMs = elapsedMs;
        }

        // Cap answeredIds history so the "avoid repeats" list stays small.
        if (!next.answeredIds.includes(email.id)) {
          next.answeredIds = [email.id, ...next.answeredIds].slice(0, 30);
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
      if (nextIndex >= s.deck.length) {
        return { ...s, phase: "summary" };
      }
      return { ...s, index: nextIndex };
    });
    startedAtRef.current = Date.now();
    toolsThisEmailRef.current = new Set();
  }, []);

  // When a round ends, roll up round-level achievements + daily streak.
  const finalizeRound = useCallback(() => {
    const answers = Object.values(state.answered);

    // Record the daily challenge result once (first completion of the day wins).
    if (state.mode === "daily" && answers.length > 0) {
      const dateKey = todayKey();
      if (!store.getDailyResult(dateKey)) {
        const result: DailyResult = {
          dateKey,
          correct: answers.filter((a) => a.result.correct).length,
          total: answers.length,
          points: state.roundScore,
          completedAt: new Date().toISOString(),
        };
        store.setDailyResult(result);
      }
    }

    setStats((prev) => {
      const allCorrect = answers.length > 0 && answers.every((a) => a.result.correct);
      const usedHeaders = answers.some((a) => a.usedHeaders);

      let next: LifetimeStats = {
        ...prev,
        roundsPlayed: prev.roundsPlayed + 1,
        perfectHeaderRounds:
          allCorrect && usedHeaders ? prev.perfectHeaderRounds + 1 : prev.perfectHeaderRounds,
      };
      next = updateDailyStreak(next);
      saveStats(next);
      return next;
    });
  }, [state.answered, state.mode, state.roundScore]);

  const setHandle = useCallback((handle: string) => {
    setStats((prev) => {
      const next = { ...prev, handle };
      saveStats(next);
      return next;
    });
  }, []);

  const level = useMemo(() => levelForXp(stats.xp), [stats.xp]);
  const tier = useMemo(() => tierForLevel(level.level), [level.level]);

  const answeredCount = Object.keys(state.answered).length;

  return {
    // state
    deck: state.deck,
    index: state.index,
    phase: state.phase,
    mode: state.mode,
    currentEmail,
    currentFeedback,
    answered: state.answered,
    answeredCount,
    roundScore: state.roundScore,
    streak: state.streak,
    config,
    // derived
    stats,
    level,
    tier,
    // actions
    startRound,
    startDaily,
    setOrgContent,
    selectIndex,
    answer,
    next,
    finalizeRound,
    recordTool,
    setHandle,
  };
}

export type UseGame = ReturnType<typeof useGame>;
