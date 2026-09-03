"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function ThemeSwitcher() {
  const { theme, setTheme, mode, toggleMode } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <div
        role="tablist"
        aria-label="Email client theme"
        className="flex overflow-hidden rounded-full border border-border text-xs"
      >
        {(["gmail", "outlook"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={theme === t}
            onClick={() => setTheme(t)}
            className={[
              "px-3 py-1.5 font-medium capitalize transition",
              theme === t ? "bg-accent text-[color:var(--accent-ink)]" : "text-ink-muted hover:bg-[var(--row-hover)]",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={toggleMode}
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={mode === "dark" ? "Light mode" : "Dark mode"}
        className="rounded-full border border-border p-2 text-ink-muted transition hover:bg-[var(--row-hover)]"
      >
        {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
}
