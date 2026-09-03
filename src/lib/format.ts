/** Small presentational helpers shared across the inbox UI. */

/** Gmail-style relative timestamp: time for today, "MMM D" otherwise. */
export function formatListTime(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Full timestamp for the reading pane header. */
export function formatFullTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Two-letter initials for the avatar. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic avatar color from a string. */
const AVATAR_COLORS = [
  "#1a73e8",
  "#d93025",
  "#188038",
  "#e37400",
  "#8b5cf6",
  "#0f6cbd",
  "#c2185b",
  "#00897b",
];
export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/** Extract the registrable-ish host from a URL for the status bar / inspector. */
export function hostFromUrl(href: string): string {
  try {
    const u = new URL(href);
    return u.host;
  } catch {
    return href;
  }
}

/** The username portion before '@' in a URL authority (the classic '@' trick). */
export function urlUserinfo(href: string): string | null {
  try {
    const u = new URL(href);
    return u.username ? u.username : null;
  } catch {
    return null;
  }
}

/** Domain of an email address. */
export function domainOf(address: string): string {
  const at = address.lastIndexOf("@");
  return at >= 0 ? address.slice(at + 1) : address;
}
