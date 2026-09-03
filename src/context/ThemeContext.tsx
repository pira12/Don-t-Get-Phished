"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ClientTheme = "gmail" | "outlook";
export type ColorMode = "light" | "dark";

type ThemeState = {
  theme: ClientTheme;
  mode: ColorMode;
  setTheme: (t: ClientTheme) => void;
  setMode: (m: ColorMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

const THEME_KEY = "izd.theme";
const MODE_KEY = "izd.mode";

function safeGet(key: string): string | null {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ClientTheme>("gmail");
  const [mode, setModeState] = useState<ColorMode>("light");
  const [hydrated, setHydrated] = useState(false);

  // Read persisted preferences (and OS dark-mode default) once on mount.
  useEffect(() => {
    const storedTheme = safeGet(THEME_KEY) as ClientTheme | null;
    const storedMode = safeGet(MODE_KEY) as ColorMode | null;
    const prefersDark =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

    if (storedTheme === "gmail" || storedTheme === "outlook") setThemeState(storedTheme);
    if (storedMode === "light" || storedMode === "dark") setModeState(storedMode);
    else if (prefersDark) setModeState("dark");
    setHydrated(true);
  }, []);

  // Reflect theme/mode onto <html> so the CSS-variable layer restyles live.
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-mode", mode);
    root.style.colorScheme = mode;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
      window.localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* storage may be unavailable (private mode) — ignore */
    }
  }, [theme, mode, hydrated]);

  const value: ThemeState = {
    theme,
    mode,
    setTheme: setThemeState,
    setMode: setModeState,
    toggleMode: () => setModeState((m) => (m === "light" ? "dark" : "light")),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
