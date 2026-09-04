import { describe, it, expect, vi } from "vitest";
import { rateLimit } from "@/server/rateLimit";

describe("rateLimit", () => {
  it("allows up to the limit then blocks within the window", () => {
    const key = `test:${Math.random()}`;
    const r1 = rateLimit(key, 3, 60_000);
    const r2 = rateLimit(key, 3, 60_000);
    const r3 = rateLimit(key, 3, 60_000);
    const r4 = rateLimit(key, 3, 60_000);
    expect([r1.ok, r2.ok, r3.ok]).toEqual([true, true, true]);
    expect(r1.remaining).toBe(2);
    expect(r4.ok).toBe(false);
    expect(r4.retryAfterSec).toBeGreaterThan(0);
  });

  it("keeps separate keys independent", () => {
    const a = `test:a:${Math.random()}`;
    const b = `test:b:${Math.random()}`;
    expect(rateLimit(a, 1, 60_000).ok).toBe(true);
    expect(rateLimit(a, 1, 60_000).ok).toBe(false);
    expect(rateLimit(b, 1, 60_000).ok).toBe(true);
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    try {
      const key = `test:reset:${Math.random()}`;
      expect(rateLimit(key, 1, 1000).ok).toBe(true);
      expect(rateLimit(key, 1, 1000).ok).toBe(false); // still within window
      vi.advanceTimersByTime(1001);
      expect(rateLimit(key, 1, 1000).ok).toBe(true); // window elapsed
    } finally {
      vi.useRealTimers();
    }
  });
});
