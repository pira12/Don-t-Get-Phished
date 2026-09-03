"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Users, Activity, Target, AlertTriangle, Copy, Check } from "lucide-react";
import { useSession } from "@/net/session";
import { api, type AdminOverviewResponse } from "@/net/api";
import { TECHNIQUE_LABELS, type RedFlagType } from "@/game/types";
import { ContentAdmin } from "./ContentAdmin";
import { AssignmentsAdmin } from "./AssignmentsAdmin";
import { ReportsAdmin } from "./ReportsAdmin";

type Tab = "overview" | "content" | "assignments" | "reports";

export function AdminView() {
  const session = useSession();
  const adminOrgs = useMemo(
    () => session.memberships.filter((m) => m.membership.role === "org_admin"),
    [session.memberships],
  );
  const [orgId, setOrgId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orgId && adminOrgs[0]) setOrgId(adminOrgs[0].org.id);
  }, [adminOrgs, orgId]);

  const load = useCallback(async () => {
    if (!orgId) return;
    try {
      setData(await api.adminOverview(orgId));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!session.backendAvailable) return <Note title="The admin dashboard is an online feature" />;
  if (session.status !== "authed") return <Note title="Sign in to access the admin dashboard" />;
  if (adminOrgs.length === 0)
    return <Note title="You're not an admin of any org yet" body="Create an organization to get an admin dashboard, or ask an org admin to make you one." />;

  const maxDay = Math.max(1, ...(data?.overview.participationByDay.map((d) => d.rounds) ?? [1]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Inbox
        </Link>
        <h1 className="inline-flex items-center gap-2 text-lg font-semibold text-ink">
          <Shield size={18} className="text-accent" /> Admin dashboard
        </h1>
        {adminOrgs.length > 1 ? (
          <select
            value={orgId ?? ""}
            onChange={(e) => setOrgId(e.target.value)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink"
          >
            {adminOrgs.map((m) => (
              <option key={m.org.id} value={m.org.id}>{m.org.name}</option>
            ))}
          </select>
        ) : (
          <span className="text-sm font-medium text-ink">{data?.org.name}</span>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-2">
        {(["overview", "content", "assignments", "reports"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition",
              tab === t ? "bg-accent text-[color:var(--accent-ink)]" : "border border-border text-ink-muted hover:bg-[var(--row-hover)]",
            ].join(" ")}
          >
            {t === "content" ? "Custom content" : t}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {tab === "content" && orgId && <ContentAdmin orgId={orgId} />}
      {tab === "assignments" && orgId && <AssignmentsAdmin orgId={orgId} />}
      {tab === "reports" && orgId && <ReportsAdmin orgId={orgId} />}

      {tab === "overview" && data && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 text-sm">
            <span className="text-ink-muted">Invite people with join code</span>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(data.org.joinCode).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 font-mono text-accent"
            >
              {data.org.joinCode} {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat icon={<Users size={15} />} label="Active users" value={String(data.overview.activeUsers)} />
            <Stat icon={<Activity size={15} />} label="Rounds played" value={String(data.overview.totalRounds)} />
            <Stat icon={<Target size={15} />} label="Avg accuracy" value={`${Math.round(data.overview.avgAccuracy * 100)}%`} />
            <Stat icon={<AlertTriangle size={15} />} label="At-risk" value={String(data.members.filter((m) => m.atRisk).length)} />
          </div>

          {/* Participation sparkline */}
          <section className="mt-5 rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Participation (last 14 active days)</h2>
            {data.overview.participationByDay.length === 0 ? (
              <p className="text-sm text-ink-muted">No activity yet.</p>
            ) : (
              <div className="flex h-24 items-end gap-1">
                {data.overview.participationByDay.map((d) => (
                  <div key={d.date} className="flex-1" title={`${d.date}: ${d.rounds} rounds`}>
                    <div
                      className="rounded-t bg-accent"
                      style={{ height: `${(d.rounds / maxDay) * 100}%`, minHeight: 3 }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Weakness heatmap */}
          <section className="mt-5 rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-1 text-sm font-semibold text-ink">Weakness heatmap</h2>
            <p className="mb-4 text-xs text-ink-muted">
              Which phishing techniques your workforce misses most — where real-world risk sits.
            </p>
            {data.heatmap.length === 0 ? (
              <p className="text-sm text-ink-muted">Not enough data yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {data.heatmap.map((h) => {
                  const miss = Math.round(h.missRate * 100);
                  return (
                    <li key={h.technique} className="flex items-center gap-3">
                      <span className="w-52 shrink-0 truncate text-xs text-ink-muted">
                        {TECHNIQUE_LABELS[h.technique as RedFlagType] ?? h.technique}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${miss}%`, background: miss >= 50 ? "var(--danger)" : miss >= 25 ? "var(--warning)" : "var(--success)" }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-right text-xs text-ink">{miss}% missed</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Members */}
          <section className="mt-5 rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">People ({data.members.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-ink-faint">
                    <th className="py-2">Member</th>
                    <th className="py-2">Team</th>
                    <th className="py-2 text-right">Accuracy</th>
                    <th className="py-2 text-right">Missed phish</th>
                    <th className="py-2 text-right">Rounds</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.members.map((m) => (
                    <tr key={m.userId} className="border-t border-border">
                      <td className="py-2 text-ink">{m.name}{m.role === "org_admin" && <span className="ml-1 text-[10px] text-accent">(admin)</span>}</td>
                      <td className="py-2 text-ink-muted">{m.team ?? "—"}</td>
                      <td className="py-2 text-right text-ink">{m.answered ? `${Math.round(m.accuracy * 100)}%` : "—"}</td>
                      <td className="py-2 text-right text-ink-muted">{m.falseNegatives}</td>
                      <td className="py-2 text-right text-ink-muted">{m.recentRounds}</td>
                      <td className="py-2 text-right">
                        {m.atRisk ? (
                          <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] text-[color:var(--warning)]">needs practice</span>
                        ) : m.answered ? (
                          <span className="text-[11px] text-success">on track</span>
                        ) : (
                          <span className="text-[11px] text-ink-faint">no data</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-ink-faint">
              &ldquo;Needs practice&rdquo; flags people who&apos;d benefit from more training — for support, never public shaming.
            </p>
          </section>

          {/* Audit */}
          {data.audit.length > 0 && (
            <section className="mt-5 rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-3 text-sm font-semibold text-ink">Audit log</h2>
              <ul className="flex flex-col gap-1.5 text-xs text-ink-muted">
                {data.audit.map((a) => (
                  <li key={a.id} className="flex justify-between gap-3">
                    <span>{a.detail}</span>
                    <span className="shrink-0 text-ink-faint">{new Date(a.at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 text-ink-faint">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1 text-xl font-bold text-ink">{value}</div>
    </div>
  );
}

function Note({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <Shield size={28} className="mx-auto mb-3 text-ink-faint" />
      <h1 className="mb-2 text-lg font-semibold text-ink">{title}</h1>
      {body && <p className="text-sm text-ink-muted">{body}</p>}
      <Link href="/" className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)]">
        Back to inbox
      </Link>
    </div>
  );
}
