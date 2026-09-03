/**
 * XP → level curve and competitive tiers. Pure + testable.
 * Each level costs a bit more than the last (gentle quadratic growth).
 */

export type Tier = {
  name: string;
  minLevel: number;
  color: string;
};

/** Ranked ladder. Tier is driven by level here; a future backend blends in Elo. */
export const TIERS: Tier[] = [
  { name: "Bronze", minLevel: 1, color: "#a9743b" },
  { name: "Silver", minLevel: 4, color: "#9aa0a6" },
  { name: "Gold", minLevel: 8, color: "#e0a021" },
  { name: "Platinum", minLevel: 13, color: "#3fb6b2" },
  { name: "Diamond", minLevel: 19, color: "#4d8bf5" },
  { name: "Threat Hunter", minLevel: 26, color: "#8b5cf6" },
];

/** Total XP required to have *reached* a given level (level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // 120 * (n-1)^1.55, rounded to a tidy number.
  const raw = 120 * Math.pow(level - 1, 1.55);
  return Math.round(raw / 10) * 10;
}

export type LevelInfo = {
  level: number;
  currentLevelXp: number; // xp at the start of the current level
  nextLevelXp: number; // xp needed to reach the next level
  intoLevel: number; // xp earned inside the current level
  span: number; // xp span of the current level
  progress: number; // 0..1 through the current level
};

export function levelForXp(totalXp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;

  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const span = nextLevelXp - currentLevelXp;
  const intoLevel = totalXp - currentLevelXp;

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    intoLevel,
    span,
    progress: span > 0 ? intoLevel / span : 0,
  };
}

export function tierForLevel(level: number): Tier {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (level >= t.minLevel) tier = t;
  }
  return tier;
}
