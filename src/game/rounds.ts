/**
 * Round construction. Pure helpers so the deck logic is testable and reusable
 * by duels / daily challenge / weakness-practice on a future server.
 */

import type { Difficulty, GameEmail, RedFlagType } from "./types";

/** Deterministic-ish shuffle (Fisher–Yates) with an injectable RNG for tests. */
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type RoundOptions = {
  size?: number;
  difficulty?: Difficulty | "mixed";
  /** Bias the deck toward these techniques (weakness practice). */
  focusTechniques?: RedFlagType[];
  /** Prefer emails the player hasn't answered recently. */
  avoidIds?: string[];
  rng?: () => number;
};

/**
 * Build a balanced round: aim for a ~50/50 phishing/legit split, honour the
 * requested difficulty, and (softly) prefer unseen emails and focus techniques.
 */
export function buildRound(pool: GameEmail[], opts: RoundOptions = {}): GameEmail[] {
  const { size = 10, difficulty = "mixed", focusTechniques, avoidIds = [], rng = Math.random } = opts;

  let candidates = pool.filter((e) => (difficulty === "mixed" ? true : e.difficulty === difficulty));
  if (candidates.length === 0) candidates = [...pool];

  const avoid = new Set(avoidIds);
  const fresh = candidates.filter((e) => !avoid.has(e.id));
  const seen = candidates.filter((e) => avoid.has(e.id));

  const score = (e: GameEmail) => {
    if (!focusTechniques || focusTechniques.length === 0) return 0;
    const tags = e.techniqueTags ?? [];
    return tags.filter((t) => focusTechniques.includes(t)).length;
  };

  const rank = (list: GameEmail[]) =>
    shuffle(list, rng).sort((a, b) => score(b) - score(a));

  const ordered = [...rank(fresh), ...rank(seen)];

  // Split by truth so we can interleave for a balanced deck.
  const phishing = ordered.filter((e) => e.truth === "phishing");
  const legit = ordered.filter((e) => e.truth === "legit");

  const deck: GameEmail[] = [];
  const half = Math.ceil(size / 2);
  for (let i = 0; i < half; i++) {
    if (phishing[i]) deck.push(phishing[i]);
    if (legit[i]) deck.push(legit[i]);
  }

  // Fill any shortfall and trim to size, then shuffle order of presentation.
  const used = new Set(deck.map((e) => e.id));
  for (const e of ordered) {
    if (deck.length >= size) break;
    if (!used.has(e.id)) {
      deck.push(e);
      used.add(e.id);
    }
  }

  return shuffle(deck.slice(0, size), rng);
}

/**
 * Channel-agnostic deck builder. Any scenario with `{ id, truth, difficulty }`
 * (email or the newer channels) can go through this. Aims for a ~50/50
 * threat/legit split, prefers unseen items, then shuffles.
 */
export function buildScenarioRound<
  T extends { id: string; truth: "phishing" | "legit"; difficulty: Difficulty },
>(pool: T[], opts: { size?: number; difficulty?: Difficulty | "mixed"; avoidIds?: string[]; rng?: () => number } = {}): T[] {
  const { size = 8, difficulty = "mixed", avoidIds = [], rng = Math.random } = opts;

  let candidates = pool.filter((e) => (difficulty === "mixed" ? true : e.difficulty === difficulty));
  if (candidates.length === 0) candidates = [...pool];

  const avoid = new Set(avoidIds);
  const fresh = shuffle(candidates.filter((e) => !avoid.has(e.id)), rng);
  const seen = shuffle(candidates.filter((e) => avoid.has(e.id)), rng);
  const ordered = [...fresh, ...seen];

  const phishing = ordered.filter((e) => e.truth === "phishing");
  const legit = ordered.filter((e) => e.truth === "legit");

  const deck: T[] = [];
  const half = Math.ceil(size / 2);
  for (let i = 0; i < half; i++) {
    if (phishing[i]) deck.push(phishing[i]);
    if (legit[i]) deck.push(legit[i]);
  }
  const used = new Set(deck.map((e) => e.id));
  for (const e of ordered) {
    if (deck.length >= size) break;
    if (!used.has(e.id)) {
      deck.push(e);
      used.add(e.id);
    }
  }
  return shuffle(deck.slice(0, size), rng);
}

/**
 * Build a MIXED round drawn across several channels — the realistic
 * cross-channel vigilance drill. Interleaves so consecutive items tend to switch
 * channel, keeping the player on their toes.
 */
export function buildMixedRound<T extends { id: string; truth: "phishing" | "legit"; difficulty: Difficulty; channel: string }>(
  pools: T[][],
  opts: { size?: number; difficulty?: Difficulty | "mixed"; avoidIds?: string[]; rng?: () => number } = {},
): T[] {
  const { size = 10, rng = Math.random } = opts;
  // Take a balanced slice from each channel, then round-robin by channel.
  const perChannel = Math.max(2, Math.ceil(size / pools.filter((p) => p.length).length || 1));
  const slices = pools
    .filter((p) => p.length)
    .map((p) => buildScenarioRound(p, { ...opts, size: perChannel }));

  const deck: T[] = [];
  let added = true;
  for (let i = 0; added; i++) {
    added = false;
    for (const slice of slices) {
      if (slice[i]) {
        deck.push(slice[i]);
        added = true;
      }
    }
  }
  return shuffle(deck, rng).slice(0, size);
}
