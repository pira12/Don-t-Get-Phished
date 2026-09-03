"use client";

import { avatarColor, initials } from "@/lib/format";
import { useTheme } from "@/context/ThemeContext";

export function Avatar({
  name,
  size = 40,
  warn = false,
}: {
  name: string;
  size?: number;
  /** Show the red "?" ring Gmail uses for unauthenticated senders. */
  warn?: boolean;
}) {
  const { theme } = useTheme();
  const radius = theme === "outlook" ? "20%" : "50%";
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: warn ? "var(--danger)" : avatarColor(name),
        color: "#fff",
        fontSize: size * 0.4,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {warn ? "?" : initials(name)}
    </div>
  );
}
