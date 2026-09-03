"use client";

import { ShieldAlert, Lock } from "lucide-react";
import type { GameEmail } from "@/game/types";
import { domainOf } from "@/lib/format";

/**
 * The authentic "to me ▾" detail table Gmail reveals, plus the red
 * "failed authentication" banner. A primary forensic surface.
 */
export function SenderDetails({ email }: { email: GameEmail }) {
  const fromDomain = domainOf(email.from.address);
  const replyTo = email.replyTo ?? email.from.address;
  const replyToDomain = domainOf(replyTo);
  const authFailed = email.auth.dmarc === "fail" || email.auth.dkim === "fail" || email.auth.spf === "fail";
  const replyMismatch = replyToDomain !== fromDomain;

  const rows: { label: string; value: string; warn?: boolean }[] = [
    { label: "from", value: `${email.from.name} <${email.from.address}>` },
    { label: "reply-to", value: replyTo, warn: replyMismatch },
    { label: "to", value: email.to },
    { label: "mailed-by", value: email.mailedBy ?? fromDomain, warn: (email.mailedBy ?? fromDomain) !== fromDomain },
    { label: "signed-by", value: email.signedBy ?? "—", warn: (email.signedBy ?? "—") === "—" },
    {
      label: "security",
      value:
        email.auth.dkim === "pass"
          ? "Standard encryption (TLS)"
          : "No encryption / unverified",
      warn: email.auth.dkim !== "pass",
    },
  ];

  return (
    <div className="mt-2 rounded-client border border-border bg-surface-2 p-3 text-xs">
      {authFailed && (
        <div className="mb-2 flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2 text-danger">
          <ShieldAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            <strong>This sender failed authentication.</strong> The message may be spoofed — treat
            links and requests with caution.
          </span>
        </div>
      )}
      {email.firstTimeSender && !authFailed && (
        <div className="mb-2 rounded-md bg-warning-soft px-3 py-2 text-[color:var(--warning)]">
          You don&apos;t usually get emails from this address. Be careful.
        </div>
      )}
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="align-top">
              <td className="whitespace-nowrap py-1 pr-3 text-right text-ink-faint">{r.label}:</td>
              <td className={["py-1", r.warn ? "font-semibold text-danger" : "text-ink"].join(" ")}>
                <span className="inline-flex items-center gap-1.5">
                  {r.label === "security" && r.value.includes("TLS") && (
                    <Lock size={12} className="text-success" aria-hidden />
                  )}
                  {r.value}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
