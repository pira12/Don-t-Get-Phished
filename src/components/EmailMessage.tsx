"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { ChevronDown, ChevronUp, Reply, ReplyAll, Forward } from "lucide-react";
import type { GameEmail } from "@/game/types";
import type { ToolName } from "@/hooks/useGame";
import { Avatar } from "./Avatar";
import { SenderDetails } from "./SenderDetails";
import { HeaderPanel } from "./HeaderPanel";
import { AttachmentChip } from "./AttachmentChip";
import { LinkInspector, type InspectTarget } from "./LinkInspector";
import { CONTENT_DISCLAIMER } from "@/data/emails";
import { formatFullTime } from "@/lib/format";

/**
 * The realistic rendered email — sender block, "Show original" headers, the HTML
 * body with all link forensic tools, and attachments. Shared by the training
 * ReadingPane and the DuelArena so the inbox always looks and behaves the same,
 * exactly as the brief asks (the competitive chrome lives *around* this).
 */
export function EmailMessage({
  email,
  onTool,
  onHoverLink,
  showSender,
  setShowSender,
  showHeaders,
  setShowHeaders,
  containerRef,
  showReplyActions = true,
}: {
  email: GameEmail;
  onTool: (t: ToolName) => void;
  onHoverLink: (href: string | null) => void;
  showSender: boolean;
  setShowSender: (v: boolean) => void;
  showHeaders: boolean;
  setShowHeaders: (v: boolean) => void;
  containerRef?: RefObject<HTMLDivElement>;
  showReplyActions?: boolean;
}) {
  const [inspect, setInspect] = useState<InspectTarget | null>(null);

  useEffect(() => {
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

  const authFailed =
    email.auth.dmarc === "fail" || email.auth.dkim === "fail" || email.auth.spf === "fail";

  return (
    <div ref={containerRef} className="thin-scroll h-full overflow-y-auto px-4 py-4 md:px-6">
      <h1 className="mb-4 text-xl font-normal text-ink md:text-2xl">{email.subject}</h1>

      {showHeaders && (
        <div className="mb-4">
          <HeaderPanel email={email} onClose={() => setShowHeaders(false)} />
        </div>
      )}

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

      <div
        className="email-body mt-5"
        onMouseOver={onBodyMouseOver}
        onMouseOut={onBodyMouseOut}
        onClick={onBodyClick}
        onContextMenu={onBodyContextMenu}
        dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
      />

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

      {showReplyActions && (
        <div className="mt-6 flex flex-wrap gap-2">
          <ReplyBtn icon={<Reply size={15} />} label="Reply" />
          <ReplyBtn icon={<ReplyAll size={15} />} label="Reply all" />
          <ReplyBtn icon={<Forward size={15} />} label="Forward" />
        </div>
      )}

      <p className="mt-8 border-t border-border pt-3 text-[11px] leading-snug text-ink-faint">
        {CONTENT_DISCLAIMER}
      </p>

      {inspect && <LinkInspector target={inspect} email={email} onClose={() => setInspect(null)} />}
    </div>
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
