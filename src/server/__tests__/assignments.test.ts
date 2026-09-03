import { describe, it, expect } from "vitest";
import { computeAssignmentProgress, assignmentAppliesTo } from "@/server/assignments";
import type { Assignment, RoundEvent } from "@/server/types";

const base: Assignment = {
  id: "a1",
  orgId: "o1",
  createdBy: "admin",
  title: "Refresher",
  difficulty: "medium",
  focusTechnique: null,
  minAccuracy: 0.8,
  minRounds: 2,
  team: null,
  dueDate: null,
  createdAt: "2026-09-01T00:00:00Z",
};

function evt(p: Partial<RoundEvent>): RoundEvent {
  return {
    id: Math.random().toString(36),
    userId: "u1",
    orgId: "o1",
    at: "2026-09-02T00:00:00Z",
    difficulty: "medium",
    total: 10,
    correct: 9,
    points: 900,
    falsePositives: 0,
    falseNegatives: 1,
    techniqueSeen: {},
    techniqueCaught: {},
    ...p,
  };
}

describe("computeAssignmentProgress", () => {
  it("counts only qualifying rounds and marks complete at minRounds", () => {
    const prog = computeAssignmentProgress(base, [
      evt({ correct: 9 }), // 90% — qualifies
      evt({ correct: 7 }), // 70% — below target
      evt({ correct: 8 }), // 80% — qualifies
    ]);
    expect(prog.qualifyingRounds).toBe(2);
    expect(prog.complete).toBe(true);
    expect(prog.bestAccuracy).toBeCloseTo(0.9);
  });

  it("ignores rounds before the assignment was created", () => {
    const prog = computeAssignmentProgress(base, [evt({ at: "2026-08-01T00:00:00Z", correct: 10 })]);
    expect(prog.qualifyingRounds).toBe(0);
    expect(prog.complete).toBe(false);
  });

  it("respects difficulty filter", () => {
    const prog = computeAssignmentProgress(base, [evt({ difficulty: "easy", correct: 10 }), evt({ difficulty: "easy", correct: 10 })]);
    expect(prog.qualifyingRounds).toBe(0);
  });

  it("requires the focus technique when set", () => {
    const focused: Assignment = { ...base, focusTechnique: "auth_fail", minRounds: 1 };
    expect(computeAssignmentProgress(focused, [evt({ correct: 10 })]).complete).toBe(false);
    expect(
      computeAssignmentProgress(focused, [evt({ correct: 10, techniqueSeen: { auth_fail: 2 } })]).complete,
    ).toBe(true);
  });
});

describe("assignmentAppliesTo", () => {
  it("whole-org applies to everyone; team-scoped only to that team", () => {
    expect(assignmentAppliesTo(base, "Finance")).toBe(true);
    const team: Assignment = { ...base, team: "Finance" };
    expect(assignmentAppliesTo(team, "Finance")).toBe(true);
    expect(assignmentAppliesTo(team, "Sales")).toBe(false);
    expect(assignmentAppliesTo(team, null)).toBe(false);
  });
});
