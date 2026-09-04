"use client";

import { useEffect } from "react";

/** Route-level error boundary — a render error shows a recoverable card instead
 * of white-screening the app. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In production this is where you'd forward to your error tracker.
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--canvas)", color: "var(--ink)" }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ fontSize: 14, color: "var(--ink-muted)", marginBottom: 16 }}>
          An unexpected error occurred. Your progress is saved on this device.
        </p>
        <button
          onClick={reset}
          style={{ background: "var(--accent)", color: "var(--accent-ink)", border: 0, borderRadius: 999, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
