"use client";

import {
  Inbox,
  Star,
  Clock,
  Send,
  File,
  ShieldAlert,
  Trash2,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

type Folder = { label: string; icon: LucideIcon; count?: number; active?: boolean };

const FOLDERS: Folder[] = [
  { label: "Inbox", icon: Inbox, active: true },
  { label: "Starred", icon: Star },
  { label: "Snoozed", icon: Clock },
  { label: "Sent", icon: Send },
  { label: "Drafts", icon: File, count: 2 },
  { label: "Spam", icon: ShieldAlert },
  { label: "Trash", icon: Trash2 },
];

export function FolderRail({ unread }: { unread: number }) {
  const { theme } = useTheme();
  const isOutlook = theme === "outlook";

  return (
    <nav
      aria-label="Mail folders"
      className="hidden w-[240px] shrink-0 flex-col gap-1 overflow-y-auto bg-rail px-2 py-3 md:flex thin-scroll"
    >
      <button
        type="button"
        className="mb-3 ml-1 inline-flex w-fit items-center gap-3 rounded-2xl bg-accent-soft px-5 py-3.5 text-sm font-medium text-accent shadow-sm transition hover:brightness-95"
        style={isOutlook ? { borderRadius: 4, background: "var(--accent)", color: "var(--accent-ink)" } : undefined}
        aria-label="Compose (decorative)"
        title="Compose"
      >
        <Pencil size={18} aria-hidden />
        Compose
      </button>

      <ul className="flex flex-col gap-0.5">
        {FOLDERS.map((f) => {
          const Icon = f.icon;
          return (
            <li key={f.label}>
              <div
                className={[
                  "flex items-center gap-4 px-4 py-1.5 text-sm transition",
                  isOutlook ? "rounded" : "rounded-r-full",
                  f.active
                    ? "bg-selected font-semibold text-ink"
                    : "text-ink-muted hover:bg-[var(--row-hover)]",
                ].join(" ")}
                aria-current={f.active ? "page" : undefined}
                title={f.active ? "Inbox" : `${f.label} (visual only in this demo)`}
              >
                <Icon size={18} aria-hidden className="shrink-0" />
                <span className="flex-1 truncate">{f.label}</span>
                {f.active && unread > 0 && (
                  <span className="text-xs font-semibold text-ink-muted">{unread}</span>
                )}
                {f.count ? <span className="text-xs text-ink-faint">{f.count}</span> : null}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-auto px-4 pt-4 text-[11px] leading-snug text-ink-faint">
        Only <strong>Inbox</strong> is interactive in this training demo.
      </p>
    </nav>
  );
}
