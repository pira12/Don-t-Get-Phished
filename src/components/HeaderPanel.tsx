"use client";

import { X } from "lucide-react";
import type { AuthResult, GameEmail } from "@/game/types";
import { domainOf } from "@/lib/format";

function authClass(r: AuthResult): string {
  if (r === "pass") return "text-success";
  if (r === "softfail") return "text-[color:var(--warning)]";
  return "text-danger";
}

/**
 * "Show original" — a raw-ish header view. SPF/DKIM/DMARC results and the
 * Received chain are the deepest forensic surface; hard emails only give
 * themselves away here.
 */
export function HeaderPanel({ email, onClose }: { email: GameEmail; onClose: () => void }) {
  const fromDomain = domainOf(email.from.address);
  const replyTo = email.replyTo ?? email.from.address;
  const returnPath = `bounce@${email.mailedBy ?? fromDomain}`;

  return (
    <div className="rounded-client border border-border bg-surface-2">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h3 className="text-sm font-semibold text-ink">Original message · headers</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-ink-muted hover:bg-[var(--row-hover)]"
          aria-label="Close headers"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-x-4 gap-y-2 border-b border-border px-4 py-3 text-xs">
        <Metric label="SPF" value={email.auth.spf} />
        <Metric label="DKIM" value={email.auth.dkim} />
        <Metric label="DMARC" value={email.auth.dmarc} />
      </div>

      <pre className="thin-scroll overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-[11px] leading-relaxed text-ink-muted">
{`Delivered-To: ${email.to}
Received: from ${email.mailedBy ?? fromDomain}
        by mx.northwind.example with ESMTPS
        ${new Date(email.timestamp).toUTCString()}
Return-Path: <${returnPath}>
From: ${email.from.name} <${email.from.address}>
Reply-To: ${replyTo}
To: ${email.to}
Subject: ${email.subject}
Authentication-Results: mx.northwind.example;
        spf=${email.auth.spf} (sender ${email.auth.spf === "pass" ? "authorised" : "not authorised"})
        dkim=${email.auth.dkim} header.d=${email.signedBy && email.signedBy !== "—" ? email.signedBy : "(none)"}
        dmarc=${email.auth.dmarc} header.from=${fromDomain}`}
      </pre>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: AuthResult }) {
  return (
    <div className="flex flex-col rounded-md bg-surface px-3 py-2">
      <span className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</span>
      <span className={["text-sm font-bold uppercase", authClass(value)].join(" ")}>
        {`${label}: ${value.toUpperCase()}`}
      </span>
    </div>
  );
}
