/**
 * Pure assignment-completion logic. A round "qualifies" for an assignment when it
 * happened after the assignment was created, matches the target difficulty, meets
 * the accuracy target, and (if set) exercised the focus technique. Completion needs
 * `minRounds` qualifying rounds. No IO — unit-tested and reused by the API.
 */

import type { Assignment, RoundEvent } from "./types";

export type AssignmentProgress = {
  qualifyingRounds: number;
  complete: boolean;
  bestAccuracy: number;
};

export function computeAssignmentProgress(a: Assignment, events: RoundEvent[]): AssignmentProgress {
  let qualifying = 0;
  let bestAccuracy = 0;
  const since = new Date(a.createdAt).getTime();

  for (const e of events) {
    if (new Date(e.at).getTime() < since) continue;
    if (a.difficulty !== "mixed" && e.difficulty !== a.difficulty) continue;

    const accuracy = e.total > 0 ? e.correct / e.total : 0;
    if (a.focusTechnique && !(e.techniqueSeen[a.focusTechnique] ?? 0)) continue;

    bestAccuracy = Math.max(bestAccuracy, accuracy);
    if (accuracy >= a.minAccuracy) qualifying += 1;
  }

  return {
    qualifyingRounds: qualifying,
    complete: qualifying >= a.minRounds,
    bestAccuracy,
  };
}

/** Does this assignment apply to a member (whole-org or a matching team)? */
export function assignmentAppliesTo(a: Assignment, team: string | null): boolean {
  if (!a.team) return true;
  return !!team && a.team.toLowerCase() === team.toLowerCase();
}
