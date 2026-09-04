"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, BarChart3, Shield, ChevronDown, Building2, Cloud, CloudOff, GraduationCap, HelpCircle } from "lucide-react";
import { useSession } from "@/net/session";
import { Avatar } from "./Avatar";

/**
 * Optional, lightweight account — never a gate. Guests play fully; signing in with
 * a magic link only saves progress across devices and reserves your handle.
 */
export function AccountMenu({ handle }: { handle: string }) {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [phase, setPhase] = useState<"email" | "token">("email");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Auto-verify if the user arrived via a magic link (?token=...).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (t && session.status === "guest" && session.backendAvailable) {
      void session.verify(t).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.backendAvailable]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const displayName = session.user?.handle || handle || "Guest";
  const isAdmin = session.memberships.some((m) => m.membership.role === "org_admin");

  const sendLink = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await session.requestLink(email.trim());
      setPhase("token");
      if (r.devToken) {
        setToken(r.devToken);
        setMsg("Dev mode: your login code is filled in below. Click Verify.");
      } else {
        setMsg("Check your email for a sign-in link.");
      }
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setMsg("");
    try {
      await session.verify(token.trim(), handle);
      setOpen(false);
      setPhase("email");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-1 hover:bg-[var(--row-hover)]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
      >
        <Avatar name={displayName} size={32} />
        <ChevronDown size={14} className="text-ink-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-2xl border border-border bg-surface p-4 shadow-popover">
          <div className="mb-3 flex items-center gap-3">
            <Avatar name={displayName} size={40} />
            <div className="min-w-0">
              <div className="truncate font-semibold text-ink">{displayName}</div>
              <div className="flex items-center gap-1 text-[11px] text-ink-muted">
                {session.status === "authed" ? (
                  <>
                    <Cloud size={12} className="text-success" /> {session.user?.email}
                  </>
                ) : (
                  <>
                    <CloudOff size={12} /> {session.backendAvailable ? "Guest — progress saved on this device" : "Offline mode"}
                  </>
                )}
              </div>
            </div>
          </div>

          {session.status === "authed" ? (
            <div className="flex flex-col gap-1 text-sm">
              {session.memberships.length > 0 && (
                <div className="mb-1">
                  <label className="mb-1 block text-[11px] uppercase tracking-wide text-ink-faint">Active org</label>
                  <select
                    value={session.activeOrgId ?? ""}
                    onChange={(e) => session.setActiveOrgId(e.target.value || null)}
                    className="w-full rounded-client border border-border bg-surface-2 px-2 py-1.5 text-sm text-ink"
                  >
                    <option value="">Global (no org)</option>
                    {session.memberships.map((m) => (
                      <option key={m.org.id} value={m.org.id}>
                        {m.org.name} {m.membership.role === "org_admin" ? "(admin)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <MenuLink href="/leaderboard" icon={<BarChart3 size={15} />} label="Leaderboards" onClick={() => setOpen(false)} />
              <MenuLink href="/orgs" icon={<Building2 size={15} />} label="Organizations" onClick={() => setOpen(false)} />
              {isAdmin && (
                <MenuLink href="/admin" icon={<Shield size={15} />} label="Admin dashboard" onClick={() => setOpen(false)} />
              )}
              <button
                onClick={() => {
                  void session.logout();
                  setOpen(false);
                }}
                className="mt-1 flex items-center gap-2 rounded-client px-2 py-1.5 text-left text-danger hover:bg-[var(--row-hover)]"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          ) : session.backendAvailable ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-ink-muted">
                Save progress across devices and reserve your handle. Guests keep everything on this
                device.
              </p>
              {phase === "email" ? (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="rounded-full border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  />
                  <button
                    onClick={sendLink}
                    disabled={busy}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110 disabled:opacity-50"
                  >
                    Send magic link
                  </button>
                </>
              ) : (
                <>
                  <input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste your sign-in code"
                    className="rounded-full border border-border bg-surface-2 px-3 py-2 text-xs text-ink outline-none focus:border-accent"
                  />
                  <button
                    onClick={verify}
                    disabled={busy}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110 disabled:opacity-50"
                  >
                    Verify &amp; sign in
                  </button>
                </>
              )}
              {msg && <p className="text-[11px] text-ink-muted">{msg}</p>}
            </div>
          ) : (
            <p className="text-xs text-ink-muted">
              You&apos;re playing offline. Accounts, leaderboards and org features appear when the
              backend is enabled.
            </p>
          )}

          <div className="mt-2 border-t border-border pt-2">
            <button
              onClick={() => {
                setOpen(false);
                window.location.assign("/?intro=1");
              }}
              className="flex w-full items-center gap-2 rounded-client px-2 py-1.5 text-left text-ink hover:bg-[var(--row-hover)]"
            >
              <HelpCircle size={15} /> How to play
            </button>
            <MenuLink href="/learn" icon={<GraduationCap size={15} />} label="Learn & tools" onClick={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2 rounded-client px-2 py-1.5 text-ink hover:bg-[var(--row-hover)]">
      {icon} {label}
    </Link>
  );
}
