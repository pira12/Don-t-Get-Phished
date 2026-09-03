import { describe, it, expect } from "vitest";
import { toCsv, buildMembersReport, buildAssignmentsReport, buildTechniqueReport } from "@/server/reports";
import type { Assignment, Membership, Org, RoundEvent, UserStats } from "@/server/types";

const org: Org = {
  id: "o1",
  name: "Acme",
  joinCode: "PHISH-ABC",
  createdAt: "2026-09-01T00:00:00Z",
  settings: { leaderboardDisplay: "handle", competitiveEnabled: true },
};

describe("toCsv", () => {
  it("escapes quotes, commas and newlines", () => {
    const csv = toCsv({ headers: ["a", "b"], rows: [["x,y", 'he said "hi"'], ["line1\nline2", 3]] });
    expect(csv).toContain('"x,y"');
    expect(csv).toContain('"he said ""hi"""');
    expect(csv).toContain('"line1\nline2"');
    // header + 2 rows, CRLF-terminated
    expect(csv.trimEnd().split("\r\n")).toHaveLength(3);
  });
});

describe("buildMembersReport", () => {
  it("flags at-risk members and sorts by accuracy ascending", () => {
    const memberships: Membership[] = [
      { userId: "a", orgId: "o1", role: "player", team: "Finance", joinedAt: "2026-09-01T00:00:00Z" },
      { userId: "b", orgId: "o1", role: "org_admin", team: null, joinedAt: "2026-09-01T00:00:00Z" },
    ];
    const stats = new Map<string, UserStats>([
      ["a", { userId: "a", xp: 100, totalAnswered: 20, totalCorrect: 8, falsePositives: 3, falseNegatives: 9, bestStreak: 2, techniqueSeen: {}, techniqueCaught: {}, lastActive: "2026-09-05T00:00:00Z" }],
      ["b", { userId: "b", xp: 500, totalAnswered: 20, totalCorrect: 19, falsePositives: 0, falseNegatives: 1, bestStreak: 8, techniqueSeen: {}, techniqueCaught: {}, lastActive: "2026-09-05T00:00:00Z" }],
    ]);
    const names = new Map([["a", "Alice"], ["b", "Bob"]]);
    const table = buildMembersReport(org, memberships, stats, names, new Map());
    // Alice (40%) is at-risk and sorted first.
    expect(table.rows[0][0]).toBe("Alice");
    expect(table.rows[0][table.headers.indexOf("Status")]).toBe("Needs practice");
    expect(table.rows[1][table.headers.indexOf("Status")]).toBe("On track");
  });
});

describe("buildAssignmentsReport", () => {
  it("emits one row per assigned member with completion", () => {
    const a: Assignment = {
      id: "as1", orgId: "o1", createdBy: "b", title: "Refresher", difficulty: "medium",
      focusTechnique: null, minAccuracy: 0.8, minRounds: 1, team: null, dueDate: null, createdAt: "2026-09-01T00:00:00Z",
    };
    const memberships: Membership[] = [
      { userId: "a", orgId: "o1", role: "player", team: null, joinedAt: "2026-09-01T00:00:00Z" },
    ];
    const ev: RoundEvent = {
      id: "e", userId: "a", orgId: "o1", at: "2026-09-03T00:00:00Z", difficulty: "medium",
      total: 10, correct: 9, points: 900, falsePositives: 0, falseNegatives: 1, techniqueSeen: {}, techniqueCaught: {},
    };
    const table = buildAssignmentsReport([a], memberships, new Map([["a", "Alice"]]), new Map([["a", [ev]]]));
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0][table.headers.indexOf("Completed")]).toBe("Yes");
  });
});

describe("buildTechniqueReport", () => {
  it("computes catch/miss rates sorted by miss rate", () => {
    const events: RoundEvent[] = [
      { id: "e", userId: "a", orgId: "o1", at: "x", difficulty: "medium", total: 10, correct: 5, points: 0, falsePositives: 0, falseNegatives: 0, techniqueSeen: { urgency: 10, auth_fail: 4 }, techniqueCaught: { urgency: 9, auth_fail: 1 } },
    ];
    const table = buildTechniqueReport(events);
    // auth_fail (75% missed) ranks above urgency (10% missed).
    expect(table.rows[0][0]).toContain("Authentication");
  });
});
