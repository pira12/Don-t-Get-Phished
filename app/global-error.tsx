"use client";

/** Last-resort boundary for errors in the root layout itself. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", margin: 0 }}>
        <div style={{ maxWidth: 420, textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#666", margin: "8px 0 16px" }}>Please reload the page.</p>
          <button onClick={reset} style={{ background: "#1a73e8", color: "#fff", border: 0, borderRadius: 999, padding: "10px 20px", fontWeight: 600 }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
