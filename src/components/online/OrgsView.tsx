"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Plus, LogIn, Copy, Check, Shield } from "lucide-react";
import { useSession } from "@/net/session";
import { api } from "@/net/api";

export function OrgsView() {
  const session = useSession();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState("");

  if (!session.backendAvailable) return <Note title="Organizations are an online feature" />;
  if (session.status !== "authed")
    return <Note title="Sign in to use organizations" body="Open the account menu (top-right) and sign in with a magic link — then you can create or join an org." />;

  const createOrg = async () => {
    setMsg("");
    try {
      await api.createOrg(name.trim());
      setName("");
      await session.refresh();
      setMsg("Organization created — share its join code below.");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const joinOrg = async () => {
    setMsg("");
    try {
      await api.joinOrg(code.trim());
      setCode("");
      await session.refresh();
      setMsg("Joined!");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const copy = (c: string) => {
    navigator.clipboard?.writeText(c).then(() => {
      setCopied(c);
      setTimeout(() => setCopied(""), 1500);
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Inbox
        </Link>
        <h1 className="inline-flex items-center gap-2 text-lg font-semibold text-ink">
          <Building2 size={18} className="text-accent" /> Organizations
        </h1>
        <span />
      </div>

      {session.memberships.length > 0 && (
        <div className="mb-5 rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-ink">Your organizations</h2>
          <ul className="flex flex-col divide-y divide-border">
            {session.memberships.map((m) => (
              <li key={m.org.id} className="flex items-center gap-2 py-2.5">
                <Building2 size={16} className="text-ink-muted" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {m.org.name}
                    {m.membership.role === "org_admin" && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent">
                        <Shield size={10} /> admin
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => copy(m.org.joinCode)}
                    className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-accent"
                    title="Copy join code"
                  >
                    code: <span className="font-mono">{m.org.joinCode}</span>
                    {copied === m.org.joinCode ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                  </button>
                </div>
                {m.membership.role === "org_admin" && (
                  <Link href="/admin" className="rounded-full border border-border px-3 py-1 text-xs font-medium text-ink hover:bg-[var(--row-hover)]">
                    Dashboard
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-1 inline-flex items-center gap-2 font-semibold text-ink">
            <Plus size={16} /> Create an org
          </h3>
          <p className="mb-3 text-xs text-ink-muted">You become its admin and get a shareable join code — no IT setup.</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Security Team"
            className="mb-2 w-full rounded-full border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <button onClick={createOrg} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110">
            Create
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-1 inline-flex items-center gap-2 font-semibold text-ink">
            <LogIn size={16} /> Join with a code
          </h3>
          <p className="mb-3 text-xs text-ink-muted">Paste the code a colleague shared to join their private leaderboard.</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="PHISH-XXXXXX"
            className="mb-2 w-full rounded-full border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <button onClick={joinOrg} className="rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-ink hover:brightness-95">
            Join
          </button>
        </div>
      </div>

      {msg && <p className="mt-3 text-sm text-ink-muted">{msg}</p>}
    </div>
  );
}

function Note({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <Building2 size={28} className="mx-auto mb-3 text-ink-faint" />
      <h1 className="mb-2 text-lg font-semibold text-ink">{title}</h1>
      {body && <p className="text-sm text-ink-muted">{body}</p>}
      <Link href="/" className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)]">
        Back to inbox
      </Link>
    </div>
  );
}
