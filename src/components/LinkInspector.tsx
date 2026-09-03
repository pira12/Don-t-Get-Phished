"use client";

import { X, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { GameEmail } from "@/game/types";
import { domainOf, hostFromUrl, urlUserinfo } from "@/lib/format";

export type InspectTarget = { text: string; href: string; x: number; y: number };

/**
 * "Inspect link" card (right-click / long-press on any link). Shows the visible
 * text vs the true URL, a fictional domain age, and whether the link domain
 * matches the sender's — the skills that transfer straight to a real inbox.
 */
export function LinkInspector({
  target,
  email,
  onClose,
}: {
  target: InspectTarget;
  email: GameEmail;
  onClose: () => void;
}) {
  const host = hostFromUrl(target.href);
  const userinfo = urlUserinfo(target.href);
  const senderDomain = domainOf(email.from.address);
  const matches = host.endsWith(senderDomain);
  const insecure = target.href.startsWith("http://");

  // Deterministic fictional domain age from the host string.
  const ageDays = fakeAgeDays(host);
  const young = ageDays < 60;

  const left = Math.min(target.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 320);
  const top = Math.min(target.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 260);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-label="Inspect link"
        className="fixed z-50 w-[300px] rounded-client border border-border bg-surface p-3 shadow-popover"
        style={{ left, top }}
      >
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Inspect link</h4>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-0.5 text-ink-muted hover:bg-[var(--row-hover)]">
            <X size={14} />
          </button>
        </div>

        <dl className="space-y-2 text-xs">
          <Row label="Visible text">
            <span className="text-ink">{target.text}</span>
          </Row>
          <Row label="Actual URL">
            <span className="break-all font-mono text-[11px] text-ink">{target.href}</span>
          </Row>
          <Row label="Real domain">
            <span className={["font-semibold", matches ? "text-success" : "text-danger"].join(" ")}>
              {host}
            </span>
          </Row>
          {userinfo && (
            <Row label="Note">
              <span className="text-danger">
                Everything before “@” (<code>{userinfo}</code>) is a username, not the site.
              </span>
            </Row>
          )}
          <Row label="Domain age">
            <span className={young ? "text-danger" : "text-ink"}>
              {ageDays < 365 ? `${ageDays} days` : `${Math.round(ageDays / 365)} yr`}
              {young ? " · newly registered" : ""}
            </span>
          </Row>
        </dl>

        <div
          className={[
            "mt-3 flex items-start gap-2 rounded-md px-2.5 py-2 text-xs",
            matches && !insecure && !young ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
          ].join(" ")}
        >
          {matches && !insecure && !young ? (
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          )}
          <span>
            {matches
              ? "Link domain matches the sender's domain."
              : `Link domain does not match the sender (${senderDomain}).`}
          </span>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function fakeAgeDays(host: string): number {
  let h = 0;
  for (let i = 0; i < host.length; i++) h = (h * 33 + host.charCodeAt(i)) >>> 0;
  // Lookalike/suspicious hosts tend to be freshly registered.
  const suspicious = /\d|-|\.(net|help|tv|info)$|sharepoint-review|storage-relay|secure|support|verify|update/.test(host);
  if (suspicious) return 3 + (h % 55);
  return 400 + (h % 3000);
}
