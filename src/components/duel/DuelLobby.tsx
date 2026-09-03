"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Swords, Link2, Copy, Check, Home, Trophy } from "lucide-react";
import type { UseDuel } from "@/hooks/useDuel";
import {
  BOT_PROFILES,
  decodeChallenge,
  encodeChallenge,
  newChallenge,
  type BotSkill,
  type DuelConfig,
} from "@/game/duel";

const SKILLS: BotSkill[] = ["rookie", "analyst", "threat_hunter"];

export function DuelLobby({
  duel,
  you,
  incoming,
  origin,
}: {
  duel: UseDuel;
  you: string;
  incoming: DuelConfig | null;
  origin: string;
}) {
  const [skill, setSkill] = useState<BotSkill>("analyst");
  const [size, setSize] = useState(7);
  const [link, setLink] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [pasteCode, setPasteCode] = useState("");
  const [pasteError, setPasteError] = useState("");

  const startWith = (cfg: DuelConfig) => duel.start(cfg, skill, BOT_PROFILES[skill].label);

  const quickMatch = () => startWith(newChallenge(size, "mixed", you));

  const makeLink = () => {
    const cfg = newChallenge(size, "mixed", you);
    const code = encodeChallenge(cfg);
    setLink(`${origin}/duel?c=${code}`);
    setCopied(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — user can select the text manually */
    }
  };

  const acceptPasted = () => {
    const code = pasteCode.includes("c=") ? pasteCode.split("c=")[1].trim() : pasteCode.trim();
    const cfg = decodeChallenge(code);
    if (!cfg) {
      setPasteError("That doesn't look like a valid challenge code.");
      return;
    }
    setPasteError("");
    startWith(cfg);
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-5 overflow-y-auto p-4 md:p-8 thin-scroll">
      <div className="flex items-center justify-between">
        <h1 className="inline-flex items-center gap-2 text-xl font-semibold text-ink">
          <Swords size={20} className="text-accent" /> Duel
        </h1>
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
          <Home size={16} /> Inbox
        </Link>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-sm">
        <Trophy size={18} className="text-accent" />
        <span className="text-ink-muted">
          Your rating <strong className="text-ink">{duel.duelState.rating}</strong>
        </span>
        <span className="text-ink-muted">
          {duel.duelState.wins}W · {duel.duelState.losses}L · {duel.duelState.draws}D
        </span>
      </div>

      {incoming && (
        <div className="rounded-2xl border border-accent/40 bg-accent-soft p-5">
          <div className="mb-1 font-semibold text-ink">You&apos;ve been challenged!</div>
          <p className="mb-3 text-sm text-ink-muted">
            Someone shared a challenge link — {incoming.size} emails, same set for you both. Pick an
            opponent skill and race.
          </p>
          <button
            onClick={() => startWith(incoming)}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
          >
            Accept challenge
          </button>
        </div>
      )}

      {/* Opponent + length settings */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink">Opponent</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {SKILLS.map((s) => (
            <button
              key={s}
              onClick={() => setSkill(s)}
              className={[
                "flex items-center gap-2 rounded-client border px-3 py-2.5 text-left text-sm transition",
                skill === s ? "border-accent bg-accent-soft text-accent" : "border-border text-ink-muted hover:bg-[var(--row-hover)]",
              ].join(" ")}
            >
              <Bot size={16} />
              <span>
                <span className="block font-semibold">{BOT_PROFILES[s].label}</span>
                <span className="block text-[11px] opacity-80">
                  ~{Math.round(BOT_PROFILES[s].accuracy * 100)}% accurate
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-ink-muted">Emails per match:</span>
          {[5, 7, 10].map((n) => (
            <button
              key={n}
              onClick={() => setSize(n)}
              className={[
                "rounded-full px-3 py-1 text-xs font-medium transition",
                size === n ? "bg-accent text-[color:var(--accent-ink)]" : "border border-border text-ink-muted hover:bg-[var(--row-hover)]",
              ].join(" ")}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-1 font-semibold text-ink">Quick match</h3>
          <p className="mb-3 text-xs text-ink-muted">
            Instantly race the selected bot on a fresh set of emails.
          </p>
          <button
            onClick={quickMatch}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
          >
            <Swords size={15} /> Find opponent
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-1 font-semibold text-ink">Challenge a coworker</h3>
          <p className="mb-3 text-xs text-ink-muted">
            Generate a shareable link — you both get the exact same emails to compare scores.
          </p>
          <button
            onClick={makeLink}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-ink hover:brightness-95"
          >
            <Link2 size={15} /> Create challenge link
          </button>
          {link && (
            <div className="mt-3">
              <div className="flex items-center gap-2 rounded-client border border-border bg-surface-2 px-3 py-2">
                <input readOnly value={link} className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none" aria-label="Challenge link" />
                <button onClick={copy} aria-label="Copy link" className="shrink-0 text-ink-muted hover:text-accent">
                  {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                </button>
              </div>
              <button
                onClick={() => {
                  const code = link.split("c=")[1];
                  const cfg = decodeChallenge(code);
                  if (cfg) startWith(cfg);
                }}
                className="mt-2 text-xs font-medium text-accent hover:underline"
              >
                Play your challenge now →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Accept a pasted code */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="mb-1 font-semibold text-ink">Have a challenge code?</h3>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={pasteCode}
            onChange={(e) => setPasteCode(e.target.value)}
            placeholder="Paste a challenge link or code"
            className="min-w-0 flex-1 rounded-full border border-border bg-surface-2 px-4 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            onClick={acceptPasted}
            className="rounded-full border border-border bg-surface-2 px-5 py-2 text-sm font-semibold text-ink hover:brightness-95"
          >
            Accept
          </button>
        </div>
        {pasteError && <p className="mt-2 text-xs text-danger">{pasteError}</p>}
      </div>
    </div>
  );
}
