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
