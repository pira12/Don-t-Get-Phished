/**
 * Pure scoring + XP logic. No React, no DOM — fully unit-testable.
 * The design brief asks us to reward investigation and accuracy, and to keep
 * the streak multiplier gentle so it never turns into an arcade.
 */

import type { Difficulty, GameEmail, Verdict } from "./types";

export const BASE_POINTS = 100;

/** Difficulty weighting — a Hard call is worth more than an Easy one. */
export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  medium: 1.25,
  hard: 1.6,
};

/** Streak multiplier grows slowly and is capped so it stays gentle. */
export function streakMultiplier(streak: number): number {
  return Math.min(1 + Math.max(0, streak - 1) * 0.1, 1.5);
}

export type AnswerInput = {
  email: GameEmail;
  verdict: Verdict;
  /** ms taken to answer. */
  elapsedMs: number;
  /** Number of distinct forensic tools opened before answering. */
  toolsUsed: number;
  /** Streak count BEFORE this answer is applied. */
  currentStreak: number;
};

export type AnswerResult = {
  correct: boolean;
  points: number;
  xp: number;
  /** Breakdown for the feedback panel. */
  breakdown: {
    base: number;
    difficultyBonus: number;
    speedBonus: number;
    investigationBonus: number;
    streakBonus: number;
    actionBonus?: number;
  };
  newStreak: number;
  /** Was this a false positive (flagged legit) or false negative (missed phishing)? */
  falsePositive: boolean;
  falseNegative: boolean;
  /** Set by evaluateAction: how good the real-world action was. */
  quality?: ActionQuality;
};

/**
 * The native mail actions the game mirrors from real Gmail/Outlook, so the muscle
 * memory transfers: Report (phishing/junk), Archive (keep — it's safe), Delete.
 */
export type MailAction = "report" | "archive" | "delete";
export type ActionQuality = "ideal" | "acceptable" | "wrong";

/** A small bonus for taking the *best* real-world action, on top of being correct. */
export const ACTION_BONUS = 25;

/**
 * Map an action + the email's truth to an outcome. The lesson: report the phish,
 * keep (archive) the safe mail. Delete is a valid-but-suboptimal middle for either.
 */
export function actionOutcome(
  truth: GameEmail["truth"],
  action: MailAction,
): { correct: boolean; quality: ActionQuality; falsePositive: boolean; falseNegative: boolean } {
  if (action === "report") {
    return truth === "phishing"
      ? { correct: true, quality: "ideal", falsePositive: false, falseNegative: false }
      : { correct: false, quality: "wrong", falsePositive: true, falseNegative: false };
  }
  if (action === "archive") {
    return truth === "legit"
      ? { correct: true, quality: "ideal", falsePositive: false, falseNegative: false }
      : { correct: false, quality: "wrong", falsePositive: false, falseNegative: true };
  }
  // delete: you recognised it wasn't worth trusting/keeping — right instinct, but
  // not the ideal move (a phish should be reported; real mail could be kept).
  return { correct: true, quality: "acceptable", falsePositive: false, falseNegative: false };
}

export type ActionInput = {
  email: GameEmail;
  action: MailAction;
  elapsedMs: number;
  toolsUsed: number;
  currentStreak: number;
};

/**
 * Score a real-world action. Correct + ideal earns full points plus an action
 * bonus; a merely "acceptable" delete earns roughly half and coaching feedback;
 * a wrong action scores zero and breaks the streak (and flags FP/FN).
 */
export function evaluateAction(input: ActionInput): AnswerResult {
  const { email, action, elapsedMs, toolsUsed, currentStreak } = input;
  const outcome = actionOutcome(email.truth, action);

  if (!outcome.correct) {
    return {
      correct: false,
      points: 0,
      xp: 0,
      breakdown: { base: 0, difficultyBonus: 0, speedBonus: 0, investigationBonus: 0, streakBonus: 0, actionBonus: 0 },
      newStreak: 0,
      falsePositive: outcome.falsePositive,
      falseNegative: outcome.falseNegative,
      quality: "wrong",
    };
  }

  const newStreak = currentStreak + 1;
  const diffMult = DIFFICULTY_MULTIPLIER[email.difficulty];
  const base = BASE_POINTS;
  const difficultyBonus = Math.round(BASE_POINTS * (diffMult - 1));
  const speed = speedBonus(elapsedMs, true);
  const investigation = investigationBonus(toolsUsed, true);
  const actionBonus = outcome.quality === "ideal" ? ACTION_BONUS : 0;

  const subtotal = base + difficultyBonus + speed + investigation + actionBonus;
  const mult = streakMultiplier(newStreak);
  const streakBonus = Math.round(subtotal * (mult - 1));

  let points = subtotal + streakBonus;
  // A "delete" is correct but not ideal — worth about half, no action bonus.
  if (outcome.quality === "acceptable") points = Math.round(points * 0.5);

  return {
    correct: true,
    points,
    xp: points,
    breakdown: {
      base,
      difficultyBonus,
      speedBonus: speed,
      investigationBonus: investigation,
      streakBonus,
      actionBonus,
    },
    newStreak,
    falsePositive: false,
    falseNegative: false,
    quality: outcome.quality,
  };
}

/** Speed bonus: fast + correct is rewarded, but capped and never negative. */
export function speedBonus(elapsedMs: number, correct: boolean): number {
  if (!correct) return 0;
  const seconds = elapsedMs / 1000;
  if (seconds <= 5) return 30;
  if (seconds <= 10) return 20;
  if (seconds <= 20) return 10;
  return 0;
}

/**
 * Investigation bonus: reward opening tools BEFORE answering, so careful play
 * beats reflexive guessing. Capped at two tools' worth.
 */
export function investigationBonus(toolsUsed: number, correct: boolean): number {
  if (!correct) return 0;
  return Math.min(toolsUsed, 2) * 15;
}

export function evaluateAnswer(input: AnswerInput): AnswerResult {
  const { email, verdict, elapsedMs, toolsUsed, currentStreak } = input;
  const correct = verdict === email.truth;

  const falsePositive = !correct && email.truth === "legit";
  const falseNegative = !correct && email.truth === "phishing";

  if (!correct) {
    return {
      correct: false,
      points: 0,
      xp: 0,
      breakdown: {
        base: 0,
        difficultyBonus: 0,
        speedBonus: 0,
        investigationBonus: 0,
        streakBonus: 0,
      },
      newStreak: 0,
      falsePositive,
      falseNegative,
    };
  }

  const newStreak = currentStreak + 1;
  const diffMult = DIFFICULTY_MULTIPLIER[email.difficulty];

  const base = BASE_POINTS;
  const difficultyBonus = Math.round(BASE_POINTS * (diffMult - 1));
  const speed = speedBonus(elapsedMs, correct);
  const investigation = investigationBonus(toolsUsed, correct);

  const subtotal = base + difficultyBonus + speed + investigation;
  const mult = streakMultiplier(newStreak);
  const streakBonus = Math.round(subtotal * (mult - 1));

  const points = subtotal + streakBonus;

  return {
    correct: true,
    points,
    // XP tracks points but is a touch smoother for the level curve.
    xp: points,
    breakdown: {
      base,
      difficultyBonus,
      speedBonus: speed,
      investigationBonus: investigation,
      streakBonus,
    },
    newStreak,
    falsePositive: false,
    falseNegative: false,
  };
}
