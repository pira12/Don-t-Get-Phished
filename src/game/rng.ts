/**
 * Deterministic RNG + hashing. Pure and framework-free so a given seed always
 * produces the same sequence — this is what makes the daily challenge identical
 * for everyone on a date, and a shared duel link identical for both players.
 */

/** mulberry32 — a tiny, fast, well-distributed seeded PRNG returning [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 32-bit FNV-1a string hash — stable across runs and platforms. */
export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A stable numeric seed for a calendar day (YYYY-MM-DD). */
export function dateSeed(dateKey: string): number {
  return hashString("izd-daily:" + dateKey);
}
