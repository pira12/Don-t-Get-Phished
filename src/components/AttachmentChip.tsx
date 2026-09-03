"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, FileCode, File, AlertTriangle } from "lucide-react";
import type { Attachment } from "@/game/types";

function iconFor(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return FileText;
  if (lower.endsWith(".xlsx") || lower.endsWith(".csv")) return FileSpreadsheet;
  if (lower.endsWith(".htm") || lower.endsWith(".html") || lower.endsWith(".exe") || lower.endsWith(".docm"))
    return FileCode;
  return File;
}

/** The true extension, honouring double-extension tricks like invoice.pdf.exe. */
function realExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? "." + parts[parts.length - 1].toLowerCase() : "";
}

export function AttachmentChip({
  attachment,
  onInspect,
}: {
  attachment: Attachment;
  onInspect: (tool: "attachment_inspector") => void;
}) {
  const [open, setOpen] = useState(false);
  const Icon = iconFor(attachment.name);
  const ext = realExtension(attachment.name);
  const dangerous = attachment.suspicious;

  return (
    <div className="relative" data-anchor={attachment.name}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          onInspect("attachment_inspector");
        }}
        className={[
          "flex w-[220px] items-center gap-3 rounded-client border px-3 py-2.5 text-left transition hover:brightness-[0.98]",
          dangerous ? "border-danger/40 bg-danger-soft" : "border-border bg-surface-2",
        ].join(" ")}
        aria-expanded={open}
      >
        <Icon size={22} className={dangerous ? "text-danger" : "text-ink-muted"} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-ink">{attachment.name}</span>
          <span className="block text-[11px] text-ink-faint">
            {ext.replace(".", "").toUpperCase() || "FILE"} · {attachment.sizeKB} KB
          </span>
        </span>
        {dangerous && <AlertTriangle size={16} className="shrink-0 text-danger" aria-label="Suspicious attachment" />}
      </button>

      {open && (
        <div className="mt-1 w-[280px] rounded-client border border-border bg-surface p-3 text-xs shadow-popover">
          <div className="mb-1 font-semibold text-ink">Attachment details</div>
          <div className="text-ink-muted">
            Real file type: <span className="font-mono text-ink">{ext || "unknown"}</span>
          </div>
          {dangerous ? (
            <div className="mt-2 flex items-start gap-2 rounded-md bg-danger-soft px-2.5 py-2 text-danger">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{attachment.reason ?? "This attachment looks dangerous. Do not open it."}</span>
            </div>
          ) : (
            <div className="mt-2 text-ink-muted">{attachment.reason ?? "No obvious problems detected."}</div>
          )}
        </div>
      )}
    </div>
  );
}
