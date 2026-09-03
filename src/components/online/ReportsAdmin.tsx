"use client";

import Link from "next/link";
import { Download, FileText, Users, ClipboardList, ShieldAlert, Printer } from "lucide-react";
import { api, type ReportType } from "@/net/api";

const REPORTS: { type: ReportType; label: string; desc: string; icon: React.ReactNode }[] = [
  { type: "members", label: "Member training status", desc: "Accuracy, missed phishing, over-flagging, activity and risk per person.", icon: <Users size={18} /> },
  { type: "assignments", label: "Assignment completion", desc: "One row per assigned member: qualifying rounds, best accuracy, completed y/n.", icon: <ClipboardList size={18} /> },
  { type: "techniques", label: "Technique coverage", desc: "How much the workforce catches vs misses, per phishing technique.", icon: <FileText size={18} /> },
  { type: "audit", label: "Audit log", desc: "Immutable record of admin actions (assignments, content, joins).", icon: <ShieldAlert size={18} /> },
];

export function ReportsAdmin({ orgId }: { orgId: string }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Export audit-ready reports (completion, scores, technique coverage) as CSV, or open a
          printable summary and save it as PDF from your browser.
        </p>
        <Link
          href={`/admin/print?orgId=${orgId}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
        >
          <Printer size={15} /> Printable summary (PDF)
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <li key={r.type} className="flex flex-col rounded-2xl border border-border bg-surface p-4">
            <div className="mb-1 flex items-center gap-2 text-ink">
              <span className="text-accent">{r.icon}</span>
              <span className="font-semibold">{r.label}</span>
            </div>
            <p className="mb-3 flex-1 text-xs text-ink-muted">{r.desc}</p>
            <a
              href={api.reportCsvUrl(orgId, r.type)}
              download
              className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-ink hover:brightness-95"
            >
              <Download size={15} /> Download CSV
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[11px] text-ink-faint">
        Reports honour your org&apos;s leaderboard privacy setting (real names / handles /
        anonymised). Individual scores are for learning and coaching, not punitive action.
      </p>
    </div>
  );
}
