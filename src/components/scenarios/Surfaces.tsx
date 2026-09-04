"use client";

import { useState } from "react";
import {
  Phone,
  PhoneOff,
  Voicemail,
  Link2,
  ShieldQuestion,
  BadgeCheck,
  Globe,
  Lock,
  Unlock,
  QrCode,
  ScanLine,
  UserRound,
} from "lucide-react";
import type { CallScenario, ChatScenario, SmsScenario, WebScenario } from "@/game/types";

type Investigate = (tool: string) => void;

/** Shared: a browser-style reveal chip for a link's true destination. */
function LinkReveal({ text, href, onInvestigate }: { text: string; href: string; onInvestigate: Investigate }) {
  const [shown, setShown] = useState(false);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="text-accent underline underline-offset-2">{text}</span>
      <button
        type="button"
        onClick={() => {
          setShown((v) => !v);
          onInvestigate("link_reveal");
        }}
        className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-muted hover:border-accent"
      >
        <Link2 size={11} /> {shown ? "hide" : "check link"}
      </button>
      {shown && (
        <code className="block w-full break-all rounded bg-surface-2 px-2 py-1 text-[11px] text-ink">
          → {href}
        </code>
      )}
    </span>
  );
}

/* --------------------------------- SMS ---------------------------------- */

export function SmsThread({ s, onInvestigate }: { s: SmsScenario; onInvestigate: Investigate }) {
  const [info, setInfo] = useState(false);
  return (
    <div className="mx-auto w-full max-w-md p-4">
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-2">
        <div>
          <div className="text-sm font-semibold text-ink">{s.sender}</div>
          <div className="text-[11px] text-ink-muted">
            {s.knownContact ? "Saved contact" : "Unknown sender"} · Text message
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setInfo((v) => !v);
            onInvestigate("sender_info");
          }}
          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-ink-muted hover:border-accent"
        >
          <ShieldQuestion size={12} /> Sender info
        </button>
      </div>
      {info && (
        <div className="mb-3 rounded-xl border border-border bg-surface-2 px-3 py-2 text-[11px] text-ink-muted">
          {s.knownContact
            ? "This number is in your contacts."
            : "Not in your contacts. Sender IDs and numbers can be spoofed — judge the message, not the name."}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {s.messages.map((m, i) => (
          <div key={i} className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-2.5 text-sm text-ink">
            <p className="whitespace-pre-wrap">{m.text}</p>
            {m.link && (
              <div className="mt-1.5">
                <LinkReveal text={m.link.text} href={m.link.href} onInvestigate={onInvestigate} />
              </div>
            )}
          </div>
        ))}
        <div className="mt-1 self-center text-[11px] text-ink-faint">{s.timestamp}</div>
      </div>
    </div>
  );
}

/* --------------------------------- Call --------------------------------- */

export function CallScreen({ s, onInvestigate }: { s: CallScenario; onInvestigate: Investigate }) {
  const [details, setDetails] = useState(false);
  return (
    <div className="mx-auto w-full max-w-md p-4">
      <div className="rounded-3xl border border-border bg-gradient-to-b from-surface-2 to-surface px-5 py-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-ink-muted">
          {s.kind === "voicemail" ? <Voicemail size={30} /> : <Phone size={30} />}
        </div>
        <div className="text-lg font-semibold text-ink">{s.callerName}</div>
        <div className="text-sm text-ink-muted">{s.callerNumber}</div>
        {s.claimedOrg && <div className="mt-0.5 text-[12px] text-ink-faint">Caller ID: {s.claimedOrg}</div>}
        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] text-ink-muted">
          {s.kind === "voicemail" ? "Voicemail" : "Incoming call"}
        </div>
        <button
          type="button"
          onClick={() => {
            setDetails((v) => !v);
            onInvestigate("caller_id");
          }}
          className="mt-3 inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] text-ink-muted hover:border-accent"
        >
          <ShieldQuestion size={12} /> About caller ID
        </button>
        {details && (
          <p className="mt-2 rounded-xl bg-surface-2 px-3 py-2 text-left text-[11px] text-ink-muted">
            Caller ID and the displayed number can be spoofed to show any name or org. Never treat them as proof of
            identity — verify by calling back on a number you look up yourself.
          </p>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface p-3">
        <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {s.kind === "voicemail" ? "Transcript" : "On the call"}
        </div>
        <div className="flex flex-col gap-2">
          {s.transcript.map((line, i) => (
            <div
              key={i}
              className={[
                "max-w-[88%] rounded-2xl px-3 py-2 text-sm",
                line.speaker === "you"
                  ? "self-end rounded-br-md bg-accent-soft text-ink"
                  : "self-start rounded-bl-md bg-surface-2 text-ink",
              ].join(" ")}
            >
              {line.text}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-muted">
          <PhoneOff size={12} /> They want: <span className="text-ink">{s.ask}</span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Chat --------------------------------- */

const PLATFORM_LABEL: Record<ChatScenario["platform"], string> = {
  slack: "Slack",
  teams: "Microsoft Teams",
  whatsapp: "WhatsApp",
  instagram: "Instagram DM",
  linkedin: "LinkedIn",
};

export function ChatThread({ s, onInvestigate }: { s: ChatScenario; onInvestigate: Investigate }) {
  const [profile, setProfile] = useState(false);
  return (
    <div className="mx-auto w-full max-w-lg p-4">
      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-muted">
          <UserRound size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm font-semibold text-ink">
            {s.senderName}
            {s.verified && <BadgeCheck size={14} className="text-accent" aria-label="Verified" />}
          </div>
          <div className="truncate text-[11px] text-ink-muted">
            {PLATFORM_LABEL[s.platform]} · {s.senderHandle}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setProfile((v) => !v);
            onInvestigate("profile");
          }}
          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-ink-muted hover:border-accent"
        >
          <ShieldQuestion size={12} /> Profile
        </button>
      </div>
      {profile && (
        <div className="mb-3 rounded-xl border border-border bg-surface-2 px-3 py-2 text-[11px] text-ink-muted">
          {s.verified
            ? "Verified/known account on this workspace."
            : "Unverified account. Check the exact handle and whether it's external — impersonators copy names, not identities."}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {s.messages.map((m, i) => (
          <div
            key={i}
            className={[
              "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
              m.from === "you" ? "self-end rounded-br-md bg-accent-soft text-ink" : "self-start rounded-bl-md bg-surface-2 text-ink",
            ].join(" ")}
          >
            <p className="whitespace-pre-wrap">{m.text}</p>
            {m.link && (
              <div className="mt-1.5">
                <LinkReveal text={m.link.text} href={m.link.href} onInvestigate={onInvestigate} />
              </div>
            )}
            <div className="mt-0.5 text-right text-[10px] text-ink-faint">{m.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- Web ---------------------------------- */

/** Extract the registrable-ish domain (last two labels before the first path). */
function realDomain(url: string): string {
  try {
    const host = new URL(url).hostname;
    const parts = host.split(".");
    return parts.slice(-2).join(".");
  } catch {
    return url;
  }
}

export function WebBrowser({ s, onInvestigate }: { s: WebScenario; onInvestigate: Investigate }) {
  const [scanned, setScanned] = useState(s.entry !== "qr");
  const [inspect, setInspect] = useState(false);

  if (!scanned) {
    return (
      <div className="mx-auto w-full max-w-md p-4 text-center">
        <div className="rounded-3xl border border-border bg-surface px-6 py-8">
          <div className="mx-auto mb-3 flex h-40 w-40 items-center justify-center rounded-2xl bg-surface-2">
            <QrCode size={110} className="text-ink" />
          </div>
          <div className="text-sm font-medium text-ink">{s.qrLabel}</div>
          <p className="mt-1 text-[12px] text-ink-muted">{s.entryContext}</p>
          <button
            type="button"
            onClick={() => {
              setScanned(true);
              onInvestigate("qr_scan");
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
          >
            <ScanLine size={16} /> Scan the QR code
          </button>
          <p className="mt-2 text-[11px] text-ink-faint">A QR just hides a link — scanning shows where it really goes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {/* address bar */}
        <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
          <span className="flex items-center gap-1 text-[12px]">
            {s.https ? <Lock size={13} className="text-success" /> : <Unlock size={13} className="text-danger" />}
          </span>
          <code className="min-w-0 flex-1 truncate rounded bg-surface px-2 py-1 text-[12px] text-ink">{s.url}</code>
          <button
            type="button"
            onClick={() => {
              setInspect((v) => !v);
              onInvestigate("url_inspect");
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-ink-muted hover:border-accent"
          >
            <Globe size={12} /> Inspect
          </button>
        </div>
        {inspect && (
          <div className="border-b border-border bg-surface-2 px-3 py-2 text-[11px] text-ink-muted">
            Site actually owned by <code className="rounded bg-surface px-1 text-ink">{realDomain(s.url)}</code>.{" "}
            {s.https ? "Connection is HTTPS." : "Connection is NOT secure (plain http)."} The words before the real
            domain are decoration — only the registrable domain matters.
          </div>
        )}
        {/* page body */}
        <div className="px-5 py-8 text-center">
          {s.entry === "qr" && (
            <div className="mb-1 text-[11px] text-ink-faint">Opened from QR: {s.entryContext}</div>
          )}
          <div className="mx-auto mb-4 h-8 w-8 rounded-full bg-surface-2" />
          <h3 className="text-lg font-semibold text-ink">{s.pageTitle}</h3>
          <p className="mt-0.5 text-[12px] text-ink-muted">Imitating: {s.brandImitated}</p>
          {s.asksForSecrets && (
            <div className="mx-auto mt-4 flex max-w-xs flex-col gap-2">
              <div className="rounded-client border border-border bg-surface-2 px-3 py-2 text-left text-[12px] text-ink-faint">
                Email or username
              </div>
              <div className="rounded-client border border-border bg-surface-2 px-3 py-2 text-left text-[12px] text-ink-faint">
                Password
              </div>
              <div className="rounded-full bg-accent/40 px-4 py-2 text-[12px] font-semibold text-[color:var(--accent-ink)]">
                Sign in
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
