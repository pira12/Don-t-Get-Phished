"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  FileSearch,
} from "lucide-react";
import type { GameEmail, RedFlag, Verdict } from "@/game/types";
import type { AnswerResult } from "@/game/scoring";
import type { PerEmailFeedback, ToolName } from "@/hooks/useGame";
import { Avatar } from "./Avatar";
import { SenderDetails } from "./SenderDetails";
import { HeaderPanel } from "./HeaderPanel";
import { AttachmentChip } from "./AttachmentChip";
import { ClassificationBar } from "./ClassificationBar";
import { FeedbackPanel } from "./FeedbackPanel";
import { LinkInspector, type InspectTarget } from "./LinkInspector";
import { LinkStatusBar } from "./LinkStatusBar";
import { CONTENT_DISCLAIMER } from "@/data/emails";
import { formatFullTime, domainOf } from "@/lib/format";
import { findAndFlash } from "@/lib/highlight";

export function ReadingPane({
  email,
  feedback,
  isLast,
  onAnswer,
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
  onAnswer: (v: Verdict) => AnswerResult | undefined;
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
  const [inspect, setInspect] = useState<InspectTarget | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const answered = !!feedback;

  // Reset the local menu/inspector when the email changes (panels reset by parent).
  useEffect(() => {
    setMenuOpen(false);
    setInspect(null);
    onHoverLink(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email.id]);

  const openInspector = useCallback(
    (a: HTMLAnchorElement, x: number, y: number) => {
      setInspect({ text: a.textContent ?? "", href: a.getAttribute("href") ?? "", x, y });
      onTool("link_inspector");
    },
    [onTool],
  );

  // Event delegation on the rendered HTML body for the link forensic tools.
  const onBodyMouseOver = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    if (a) {
      onHoverLink(a.getAttribute("href"));
      onTool("link_hover");
    }
  };
  const onBodyMouseOut = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) onHoverLink(null);
  };
  const onBodyClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a") as HTMLAnchorElement | null;
    if (a) {
      // Never navigate; instead surface the link preview / inspector (mobile-friendly).
      e.preventDefault();
      openInspector(a, e.clientX, e.clientY);
    }
  };
  const onBodyContextMenu = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a") as HTMLAnchorElement | null;
    if (a) {
      e.preventDefault();
      openInspector(a, e.clientX, e.clientY);
    }
  };

  const toggleSender = () => {
    if (!showSender) onTool("sender_details");
    setShowSender(!showSender);
  };
  const openHeaders = () => {
    setShowHeaders(true);
    setMenuOpen(false);
    onTool("headers");
  };

  // Jump-to-evidence: open the surface the flag lives on, then flash it.
  const onJump = useCallback((flag: RedFlag) => {
    const t = flag.type;
    if (t === "display_name_spoof" || t === "reply_to_mismatch" || t === "lookalike_domain") {
      setShowSender(true);
    }
    if (t === "auth_fail" || t === "lookalike_domain") {
      setShowHeaders(true);
    }
    let tries = 0;
    const tick = () => {
      const ok = findAndFlash(rootRef.current, flag.anchor);
      if (!ok && tries < 5) {
        tries += 1;
        window.setTimeout(tick, 70);
      }
    };
    window.setTimeout(tick, 60);
  }, [setShowSender, setShowHeaders]);

  const senderDomain = domainOf(email.from.address);
  const authFailed =
    email.auth.dmarc === "fail" || email.auth.dkim === "fail" || email.auth.spf === "fail";

  return (
    <div ref={rootRef} className="relative flex h-full flex-col overflow-hidden bg-surface">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border px-3 py-2 text-ink-muted">
        <ToolbarBtn label="Archive"><Archive size={18} /></ToolbarBtn>
        <ToolbarBtn label="Delete"><Trash2 size={18} /></ToolbarBtn>
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
            <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-client border border-border bg-surface py-1 text-sm shadow-popover">
              <button className="block w-full px-3 py-2 text-left hover:bg-[var(--row-hover)]" onClick={openHeaders}>
                Show original (headers)
              </button>
              <button className="block w-full px-3 py-2 text-left text-ink-faint" disabled>
                Block sender
              </button>
              <button className="block w-full px-3 py-2 text-left text-ink-faint" disabled>
                Filter messages like this
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable message */}
      <div className="thin-scroll flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <h1 className="mb-4 text-xl font-normal text-ink md:text-2xl">{email.subject}</h1>

        {showHeaders && (
          <div className="mb-4">
            <HeaderPanel email={email} onClose={() => setShowHeaders(false)} />
          </div>
        )}

        {/* Sender block */}
        <div className="flex items-start gap-3">
          <Avatar name={email.from.name} size={40} warn={authFailed} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-semibold text-ink">{email.from.name}</span>
              <span className="text-sm text-ink-muted">&lt;{email.from.address}&gt;</span>
            </div>
            <button
              type="button"
              onClick={toggleSender}
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-accent"
              aria-expanded={showSender}
            >
              to me {showSender ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showSender && <SenderDetails email={email} />}
          </div>
          <time className="hidden shrink-0 text-xs text-ink-faint sm:block" dateTime={email.timestamp}>
            {formatFullTime(email.timestamp)}
          </time>
        </div>

        {/* Body */}
        <div
          ref={bodyRef}
          className="email-body mt-5"
          onMouseOver={onBodyMouseOver}
          onMouseOut={onBodyMouseOut}
          onClick={onBodyClick}
          onContextMenu={onBodyContextMenu}
          dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
        />

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 text-xs font-medium text-ink-muted">
              {email.attachments.length} attachment{email.attachments.length > 1 ? "s" : ""}
            </div>
            <div className="flex flex-wrap gap-3">
              {email.attachments.map((att) => (
                <AttachmentChip key={att.name} attachment={att} onInspect={onTool} />
              ))}
            </div>
          </div>
        )}

        {/* Decorative reply actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <ReplyBtn icon={<Reply size={15} />} label="Reply" />
          <ReplyBtn icon={<ReplyAll size={15} />} label="Reply all" />
          <ReplyBtn icon={<Forward size={15} />} label="Forward" />
        </div>

        <p className="mt-8 border-t border-border pt-3 text-[11px] leading-snug text-ink-faint">
          {CONTENT_DISCLAIMER}
        </p>
      </div>

      {/* Action / feedback area */}
      {answered ? (
        <FeedbackPanel
          email={email}
          result={feedback!.result}
          isLast={isLast}
          onJump={onJump}
          onNext={onNext}
        />
      ) : (
        <ClassificationBar onAnswer={(v) => onAnswer(v)} disabled={false} />
      )}

      <LinkStatusBar href={hoverHref} />

      {inspect && <LinkInspector target={inspect} email={email} onClose={() => setInspect(null)} />}
    </div>
  );
}

function ToolbarBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-full p-2 text-ink-muted transition hover:bg-[var(--row-hover)]"
    >
      {children}
    </button>
  );
}

function ReplyBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      className="inline-flex cursor-default items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-ink-muted"
      title={`${label} (decorative)`}
    >
      {icon}
      {label}
    </span>
  );
}
