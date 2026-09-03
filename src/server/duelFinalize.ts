/**
 * Apply Elo ratings when a match finishes — exactly once, guarded by the hub's
 * claimRating slot. Persists both players' ratings + W/L/D through the Repository.
 */

import { eloDelta } from "@/game/duel";
import { db } from "./db";
import { duelHub, type Match } from "./duelHub";
import type { DuelRating } from "./types";

const DEFAULT_RATING = 1000;

export async function getRating(userId: string, name = ""): Promise<DuelRating> {
  const r = await db.getDuelRating(userId);
  return r ?? { userId, rating: DEFAULT_RATING, wins: 0, losses: 0, draws: 0 };
}

/** Finalise ratings for a finished match if not already done. Safe to call often. */
export async function finalizeMatchRatings(match: Match): Promise<void> {
  if (match.status !== "finished") return;
  if (!duelHub.claimRating(match.id)) return; // another request handled it

  const [aId, bId] = match.order;
  const a = await getRating(aId);
  const b = await getRating(bId);

  const draw = match.winnerId == null;
  const aScore = draw ? 0.5 : match.winnerId === aId ? 1 : 0;
  const bScore = draw ? 0.5 : match.winnerId === bId ? 1 : 0;

  const aDelta = eloDelta(a.rating, b.rating, aScore);
  const bDelta = eloDelta(b.rating, a.rating, bScore);

  const aNew: DuelRating = {
    userId: aId,
    rating: Math.max(0, a.rating + aDelta),
    wins: a.wins + (aScore === 1 ? 1 : 0),
    losses: a.losses + (aScore === 0 ? 1 : 0),
    draws: a.draws + (draw ? 1 : 0),
  };
  const bNew: DuelRating = {
    userId: bId,
    rating: Math.max(0, b.rating + bDelta),
    wins: b.wins + (bScore === 1 ? 1 : 0),
    losses: b.losses + (bScore === 0 ? 1 : 0),
    draws: b.draws + (draw ? 1 : 0),
  };

  await db.putDuelRating(aNew);
  await db.putDuelRating(bNew);

  duelHub.setResults(match.id, {
    [aId]: { before: a.rating, after: aNew.rating, delta: aDelta },
    [bId]: { before: b.rating, after: bNew.rating, delta: bDelta },
  });
}
