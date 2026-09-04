"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, CalendarCheck, Swords, GraduationCap } from "lucide-react";
import type { Difficulty, RedFlagType, Verdict } from "@/game/types";
import { store } from "@/game/store";
import { todayKey } from "@/game/daily";
import { useSession } from "@/net/session";
import { api, type MyAssignment } from "@/net/api";
import { useGame } from "@/hooks/useGame";
import { TopBar } from "./TopBar";
import { FolderRail } from "./FolderRail";
import { EmailList } from "./EmailList";
import { ReadingPane } from "./ReadingPane";
import { GameSidebar } from "./GameSidebar";
import { RoundSummary } from "./RoundSummary";
import { Onboarding, hasOnboarded } from "./Onboarding";
import { HintBubble } from "./HintBubble";
import { ShortcutsModal } from "./ShortcutsModal";

const DIFFICULTIES: (Difficulty | "mixed")[] = ["easy", "medium", "hard", "mixed"];

export function InboxLayout() {
  const game = useGame();
  const session = useSession();
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [onboarding, setOnboarding] = useState(false);

  // When signed in with an active org, fold that org's published content into
  // practice rounds and load the member's assignments.
  const { status: sessionStatus, activeOrgId } = session;
  const setOrgContent = game.setOrgContent;
  useEffect(() => {
    if (sessionStatus !== "authed" || !activeOrgId) {
      setOrgContent([]);
      setAssignments([]);
      return;
    }
    let cancelled = false;
    void api
      .memberContent(activeOrgId)
      .then((r) => {
        if (!cancelled) setOrgContent(r.emails as never);
      })
      .catch(() => {});
    void api
      .myAssignments(activeOrgId)
      .then((r) => {
        if (!cancelled) setAssignments(r.assignments);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionStatus, activeOrgId, setOrgContent]);

  const openAssignments = assignments.filter((a) => !a.progress.complete);
  const trainWeakSpot = () => {
    const a = openAssignments[0]?.assignment;
    if (!a) return;
    game.startRound({
      difficulty: (a.difficulty as Difficulty | "mixed") ?? "mixed",
      focusTechniques: a.focusTechnique ? [a.focusTechnique as RedFlagType] : undefined,
    });
  };
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [handleDraft, setHandleDraft] = useState("");

  // Controlled forensic panels (lifted so keyboard shortcuts can drive them).
  const [showSender, setShowSender] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [hoverHref, setHoverHref] = useState<string | null>(null);

  const { currentEmail } = game;
  const currentId = currentEmail?.id;

  // Reset panels when the selected email changes.
  useEffect(() => {
    setShowSender(false);
    setShowHeaders(false);
    setHoverHref(null);
  }, [currentId]);

  // First-visit onboarding.
  useEffect(() => {
    if (!hasOnboarded()) setOnboarding(true);
    setHandleDraft(game.stats.handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inSummary = game.phase === "summary";

  // Keep the latest values available to the key handler without re-binding.
  const stateRef = useRef({ game, showSender, showHeaders, inSummary, onboarding, showShortcuts });
  stateRef.current = { game, showSender, showHeaders, inSummary, onboarding, showShortcuts };

  const onTool = game.recordTool;

  const answerAndAdvance = useCallback(
    (v: Verdict) => {
      const g = stateRef.current.game;
      if (!g.currentEmail || g.currentFeedback) return;
      g.answer(v);
    },
    [],
  );

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const s = stateRef.current;

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((v) => !v);
        return;
      }
      if (s.onboarding || s.showShortcuts) {
        if (e.key === "Escape") {
          setShowShortcuts(false);
        }
        return;
      }
      if (s.inSummary) return;

      const g = s.game;
      switch (e.key.toLowerCase()) {
        case "p":
          e.preventDefault();
          answerAndAdvance("phishing");
          break;
        case "l":
          e.preventDefault();
          answerAndAdvance("legit");
          break;
        case "enter":
          if (g.currentFeedback) {
            e.preventDefault();
            g.next();
          }
          break;
        case "arrowdown":
          e.preventDefault();
          g.selectIndex(Math.min(g.index + 1, g.deck.length - 1));
          break;
        case "arrowup":
          e.preventDefault();
          g.selectIndex(Math.max(g.index - 1, 0));
          break;
        case "h":
          e.preventDefault();
          if (s.showHeaders) setShowHeaders(false);
          else {
            setShowHeaders(true);
            if (!g.currentFeedback) onTool("headers");
          }
          break;
        case "s":
          e.preventDefault();
          if (s.showSender) setShowSender(false);
          else {
            setShowSender(true);
            if (!g.currentFeedback) onTool("sender_details");
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answerAndAdvance, onTool]);

  const unread = game.deck.length - game.answeredCount;

  // Mobile collapses list -> reading view. Opening an email switches to "read".
  const [mobileView, setMobileView] = useState<"list" | "read">("read");

  // Daily challenge completion (for the badge on the button).
  const [dailyDone, setDailyDone] = useState(false);
  useEffect(() => {
    setDailyDone(!!store.getDailyResult(todayKey()));
  }, [game.phase, game.mode]);
  const openEmail = (i: number) => {
    game.selectIndex(i);
    setMobileView("read");
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-canvas text-ink">
      <TopBar handle={game.stats.handle} onShortcuts={() => setShowShortcuts(true)} />

      {/* Mode + difficulty + identity strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-canvas px-3 py-2 md:px-5">
        <button
          onClick={() => game.startDaily()}
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
            game.mode === "daily"
              ? "bg-accent text-[color:var(--accent-ink)]"
              : "border border-accent/40 text-accent hover:bg-accent-soft",
          ].join(" ")}
          title="A curated set that's the same for everyone today"
        >
          <CalendarCheck size={13} /> Daily{dailyDone ? " ✓" : ""}
        </button>
        <Link
          href="/duel"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-ink-muted transition hover:bg-[var(--row-hover)]"
          title="Race a bot or challenge a coworker"
        >
          <Swords size={13} /> Duel
        </Link>
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-ink-muted transition hover:bg-[var(--row-hover)]"
          title="Learn to spot phishing + real tools"
        >
          <GraduationCap size={13} /> Learn
        </Link>

        <div className="mx-1 hidden h-4 w-px bg-border sm:block" />

        <span className="text-xs font-medium text-ink-muted">Difficulty:</span>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => game.startRound({ ...game.config, difficulty: d })}
            className={[
              "rounded-full px-3 py-1 text-xs font-medium capitalize transition",
              game.mode === "practice" && (game.config.difficulty ?? "easy") === d
                ? "bg-accent text-[color:var(--accent-ink)]"
                : "border border-border text-ink-muted hover:bg-[var(--row-hover)]",
            ].join(" ")}
          >
            {d}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="handle" className="text-xs text-ink-faint">
            Handle
          </label>
          <input
            id="handle"
            value={handleDraft}
            onChange={(e) => setHandleDraft(e.target.value)}
            onBlur={() => game.setHandle(handleDraft.trim())}
            placeholder="Pick a name"
            maxLength={20}
            className="w-32 rounded-full border border-border bg-surface px-3 py-1 text-xs text-ink outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Assigned training banner (org members with open assignments) */}
      {openAssignments.length > 0 && game.phase === "playing" && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-accent-soft px-3 py-2 text-sm md:px-5">
          <GraduationCap size={16} className="text-accent" />
          <span className="text-ink">
            You have <strong>{openAssignments.length}</strong> assigned training
            {openAssignments.length > 1 ? "s" : ""}
            {openAssignments[0] && (
              <span className="text-ink-muted">
                {" "}
                — next: “{openAssignments[0].assignment.title}” ({openAssignments[0].progress.qualifyingRounds}/
                {openAssignments[0].assignment.minRounds} rounds, target {Math.round(openAssignments[0].assignment.minAccuracy * 100)}%)
              </span>
            )}
          </span>
          <button
            onClick={trainWeakSpot}
            className="ml-auto rounded-full bg-accent px-3 py-1 text-xs font-semibold text-[color:var(--accent-ink)] hover:brightness-110"
          >
            Train now
          </button>
        </div>
      )}

      {/* Main three-pane area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <FolderRail unread={unread} />

        {inSummary ? (
          <main className="min-w-0 flex-1 overflow-hidden bg-canvas">
            <RoundSummary game={game} />
          </main>
        ) : (
          <>
            <EmailList
              deck={game.deck}
              index={game.index}
              answered={game.answered}
              onSelect={openEmail}
              className={mobileView === "read" ? "hidden md:flex" : "flex md:flex"}
            />
            <main
              className={[
                "min-w-0 flex-1 flex-col",
                mobileView === "list" ? "hidden md:flex" : "flex md:flex",
              ].join(" ")}
            >
              {currentEmail && (
                <>
                  {/* Mobile-only back-to-list bar */}
                  <button
                    onClick={() => setMobileView("list")}
                    className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2 text-sm text-ink-muted md:hidden"
                  >
                    <ChevronLeft size={16} /> Back to inbox
                  </button>
                  <div className="min-h-0 flex-1">
                    <ReadingPane
                      key={currentEmail.id}
                      email={currentEmail}
                      feedback={game.currentFeedback}
                      isLast={game.index === game.deck.length - 1}
                      onAnswer={(v) => game.answer(v)}
                      onNext={game.next}
                      onTool={onTool}
                      onHoverLink={setHoverHref}
                      hoverHref={hoverHref}
                      showSender={showSender}
                      setShowSender={setShowSender}
                      showHeaders={showHeaders}
                      setShowHeaders={setShowHeaders}
                    />
                  </div>
                </>
              )}
            </main>

            <GameSidebar game={game} />
          </>
        )}
      </div>

      {onboarding && <Onboarding onDone={() => setOnboarding(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {!onboarding && <HintBubble />}
    </div>
  );
}
