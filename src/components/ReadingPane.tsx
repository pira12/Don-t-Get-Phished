"use client";

import { useCallback, useRef, useState } from "react";
import { MoreVertical, Archive, Trash2, FileSearch, ShieldAlert, ChevronDown } from "lucide-react";
import type { GameEmail, RedFlag } from "@/game/types";
import type { AnswerResult, MailAction } from "@/game/scoring";
import type { PerEmailFeedback, ToolName } from "@/hooks/useGame";
import { EmailMessage } from "./EmailMessage";
import { ClassificationBar } from "./ClassificationBar";
import { FeedbackPanel } from "./FeedbackPanel";
import { LinkStatusBar } from "./LinkStatusBar";
import { findAndFlash } from "@/lib/highlight";

export function ReadingPane({
  email,
  feedback,
  isLast,
  onAction,
  onNext,
  onTool,
  onHoverLink,
  hoverHref,
  showSender,
  setShowSender,
  showHeaders,
  setShowHeaders,
}: {
  email: GameEmail;
  feedback?: PerEmailFeedback;
  isLast: boolean;
  onAction: (a: MailAction) => AnswerResult | undefined;
  onNext: () => void;
  onTool: (t: ToolName) => void;
  onHoverLink: (href: string | null) => void;
  hoverHref: string | null;
  showSender: boolean;
  setShowSender: (v: boolean) => void;
  showHeaders: boolean;
  setShowHeaders: (v: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const answered = !!feedback;

  const openHeaders = () => {
    setShowHeaders(true);
    setMenuOpen(false);
    onTool("headers");
  };

  const act = (a: MailAction) => {
    if (answered) return;
    setReportOpen(false);
    setMenuOpen(false);
    onAction(a);
  };

  // Jump-to-evidence: open the surface the flag lives on, then flash it.
  const onJump = useCallback(
    (flag: RedFlag) => {
      const t = flag.type;
      if (t === "display_name_spoof" || t === "reply_to_mismatch" || t === "lookalike_domain") {
        setShowSender(true);
      }
      if (t === "auth_fail" || t === "lookalike_domain") {
        setShowHeaders(true);
      }
      let tries = 0;
      const tick = () => {
        const ok = findAndFlash(messageRef.current, flag.anchor);
        if (!ok && tries < 5) {
          tries += 1;
          window.setTimeout(tick, 70);
        }
      };
      window.setTimeout(tick, 60);
    },
    [setShowSender, setShowHeaders],
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-surface">
      {/* Toolbar — the real Gmail/Outlook actions, functional for muscle memory. */}
      <div className="flex items-center gap-1 border-b border-border px-3 py-2 text-ink-muted">
        <ToolbarBtn label="Archive (looks safe) · E" onClick={() => act("archive")} disabled={answered}>
          <Archive size={18} />
        </ToolbarBtn>

        {/* Report ▾ (phishing / junk) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setReportOpen((o) => !o)}
            disabled={answered}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-[var(--row-hover)] disabled:opacity-40"
            aria-haspopup="menu"
            aria-expanded={reportOpen}
            title="Report"
          >
            <ShieldAlert size={16} /> Report <ChevronDown size={13} />
          </button>
          {reportOpen && !answered && (
            <div className="absolute left-0 top-full z-30 mt-1 w-44 rounded-client border border-border bg-surface py-1 text-sm shadow-popover">
              <button className="block w-full px-3 py-2 text-left font-medium text-danger hover:bg-[var(--row-hover)]" onClick={() => act("report")}>
                Report phishing
              </button>
              <button className="block w-full px-3 py-2 text-left hover:bg-[var(--row-hover)]" onClick={() => act("report")}>
                Report junk / spam
              </button>
            </div>
          )}
        </div>

        <ToolbarBtn label="Delete · #" onClick={() => act("delete")} disabled={answered}>
          <Trash2 size={18} />
        </ToolbarBtn>

        <div className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          onClick={showHeaders ? () => setShowHeaders(false) : openHeaders}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink hover:bg-[var(--row-hover)]"
          aria-pressed={showHeaders}
        >
          <FileSearch size={15} aria-hidden />
          {showHeaders ? "Hide original" : "Show original"}
        </button>
        <div className="relative ml-auto">
          <ToolbarBtn label="More" onClick={() => setMenuOpen((o) => !o)}>
            <MoreVertical size={18} />
          </ToolbarBtn>
          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-client border border-border bg-surface py-1 text-sm shadow-popover">
              <button
                className="block w-full px-3 py-2 text-left font-medium text-danger hover:bg-[var(--row-hover)] disabled:opacity-40"
                onClick={() => act("report")}
                disabled={answered}
              >
                Report phishing
              </button>
              <button className="block w-full px-3 py-2 text-left hover:bg-[var(--row-hover)]" onClick={openHeaders}>
                Show original (headers)
              </button>
              <button className="block w-full px-3 py-2 text-left text-ink-faint" disabled>
                Mark as unread
              </button>
              <button className="block w-full px-3 py-2 text-left text-ink-faint" disabled>
                Block sender
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Realistic message + forensic tools (shared component) */}
      <div className="min-h-0 flex-1">
        <EmailMessage
          email={email}
          onTool={onTool}
          onHoverLink={onHoverLink}
          showSender={showSender}
          setShowSender={setShowSender}
          showHeaders={showHeaders}
          setShowHeaders={setShowHeaders}
          containerRef={messageRef}
        />
      </div>

      {/* Action / feedback area */}
      {answered ? (
        <FeedbackPanel
          email={email}
          result={feedback!.result}
          action={feedback!.action}
          isLast={isLast}
          onJump={onJump}
          onNext={onNext}
        />
      ) : (
        <ClassificationBar onAction={act} disabled={false} />
      )}

      <LinkStatusBar href={hoverHref} />
    </div>
  );
}

function ToolbarBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded-full p-2 text-ink-muted transition hover:bg-[var(--row-hover)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
