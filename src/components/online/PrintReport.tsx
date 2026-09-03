"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { api, type ReportTable, type ReportType } from "@/net/api";

const SECTIONS: { type: ReportType; title: string }[] = [
  { type: "members", title: "Member training status" },
  { type: "assignments", title: "Assignment completion" },
  { type: "techniques", title: "Technique coverage" },
  { type: "audit", title: "Audit log" },
];

export function PrintReport() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [tables, setTables] = useState<Record<string, ReportTable>>({});
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("orgId");
    setOrgId(id);
    if (!id) return;
    (async () => {
      try {
        const out: Record<string, ReportTable> = {};
        for (const s of SECTIONS) {
          const r = await api.reportJson(id, s.type);
          out[s.type] = r.table;
          setOrgName(r.org.name);
          setGeneratedAt(r.generatedAt);
        }
        setTables(out);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  if (!orgId) return <div className="p-8 text-sm text-ink-muted">Missing org.</div>;
  if (error)
    return (
      <div className="p-8 text-sm text-danger">
        {error} —{" "}
        <Link href="/admin" className="underline">
          back to admin
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Back to admin
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
        >
          <Printer size={15} /> Print / Save as PDF
        </button>
      </div>

      <header className="mb-6 border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-ink">Security Awareness — Compliance Report</h1>
        <p className="text-sm text-ink-muted">
          {orgName || "Organization"} · generated {generatedAt ? new Date(generatedAt).toLocaleString() : ""}
        </p>
        <p className="mt-1 text-[11px] text-ink-faint">
          All training emails are fictional and AI-generated. Scores are for learning and coaching.
        </p>
      </header>

      {SECTIONS.map((s) => {
        const t = tables[s.type];
        return (
          <section key={s.type} className="mb-8 break-inside-avoid">
            <h2 className="mb-2 text-base font-semibold text-ink">{s.title}</h2>
            {!t ? (
              <p className="text-sm text-ink-faint">Loading…</p>
            ) : t.rows.length === 0 ? (
              <p className="text-sm text-ink-faint">No data.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {t.headers.map((h) => (
                        <th key={h} className="border-b border-border py-1.5 pr-3 text-left font-semibold text-ink-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} className="border-b border-border py-1.5 pr-3 text-ink">
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
