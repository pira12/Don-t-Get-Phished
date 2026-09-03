import type { Config } from "tailwindcss";

/**
 * Colors are driven by CSS variables (see globals.css) so the Gmail and Outlook
 * themes — and light/dark mode — can be swapped live without re-rendering React.
 */
const config: Config = {
  darkMode: ["class", '[data-mode="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        rail: "var(--rail)",
        border: "var(--border)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        "ink-faint": "var(--ink-faint)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        "accent-ink": "var(--accent-ink)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)",
        success: "var(--success)",
        "success-soft": "var(--success-soft)",
        warning: "var(--warning)",
        "warning-soft": "var(--warning-soft)",
        selected: "var(--selected)",
      },
      fontFamily: {
        client: "var(--font-client)",
      },
      borderRadius: {
        client: "var(--radius)",
      },
      boxShadow: {
        popover: "0 4px 24px rgba(0,0,0,0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
