# Inbox Zero-Day

A phishing-detection training game that looks and feels like a **real modern email
client**. Players read emails in a familiar inbox, investigate each one with
authentic forensic tools (sender details, "Show original" headers, hover-to-reveal
URLs, a link inspector, an attachment inspector) and classify it as **Phishing** or
**Legitimate** — earning immediate, educational feedback that points at the exact
red flags.

The whole thing is **instantly playable with no login**: pick a handle and start
judging email. Progress is stored locally (guest-first), so the very first email is
never blocked by an account.

> All emails are **fictional and AI-generated for education only**. Company and
> product names are invented for realism and do not represent real organisations.

---

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run start      # run the production build
npm run lint       # eslint (next/core-web-vitals)
npm run test       # unit tests for the pure game logic (vitest)
```

Requires Node 18.18+ (developed on Node 22).

---

## What's implemented

The **core training experience** — the ~90% of the product players actually touch —
is complete and runnable:

- **Pixel-realistic mail client** with a **Gmail** theme (default) and a switchable
  **Outlook** theme, plus **light/dark** mode. Themes swap live via a CSS-variable
  design-token layer — no reload, no lost game state. Generic product name
  ("Sentinel Mail") and a neutral shield mark; no trademarked logos.
- **Three-pane inbox** (folder rail · email list · reading view) that collapses to
  list → reading view on mobile.
- **Forensic tools**, each mirroring something a real client does so the skill
  transfers:
  - Hover/focus a link → true destination in a **browser-style status bar**.
  - **"to me ▾"** expander → the authentic sender detail table (`from`, `reply-to`,
    `to`, `mailed-by`, `signed-by`, `security`) with a red **"failed authentication"**
    banner and a "?" avatar.
  - **"Show original"** → raw-ish headers with **SPF / DKIM / DMARC**, `Received`,
    `Return-Path`, `Reply-To`.
  - **Link inspector** (right-click / click / long-press) → visible text vs actual
    URL, fictional domain age, and whether the link domain matches the sender.
  - **Attachment inspector** → flags double extensions (`invoice.pdf.htm`),
    macro-enabled docs (`.docm`), etc.
- **Classification** with a Gmail-style action bar and **`P` / `L`** shortcuts.
- **Educational feedback**: verdict banner, ground truth, and **clickable evidence
  chips** that scroll to and flash the exact spoofed domain / urgency phrase / SPF
  fail in the message. Legit emails show the reassuring signals instead.
- **Scoring & progression** kept in pure, tested modules: points for correct calls
  with bonuses for **speed, investigation (using tools before answering), difficulty,
  and a gentle capped streak**; **XP → levels → ranked tiers** (Bronze → Threat
  Hunter); **daily streak**; **badges** that each name the real skill they certify.
- **False positives vs false negatives** tracked separately and taught — over-flagging
  is a real-world failure mode.
- **Round summary** (accuracy, points, per-technique caught/missed, review of every
  email) with **Play again / Next difficulty / Train my weak spots**.
- **Personal stats** page: lifetime accuracy, best streak, tier/level, a
  **technique-by-technique heatmap**, FP/FN distribution, and a **badge gallery**.
- **Onboarding** (3 skippable cards), a one-time contextual **hint bubble**, and a
  **keyboard shortcuts** modal (`?`).
- **Accessibility**: full keyboard play (`P`/`L`/`Enter`/`↑`/`↓`/`H`/`S`/`?`),
  visible focus states, ARIA roles/labels, and `prefers-reduced-motion` support.
- **40+ authored emails** across easy/medium/hard, balanced phishing/legit, covering
  every technique in the brief.

### Roadmap (designed-for, not yet built)

The data model, module boundaries, and `orgId`-on-every-row soft multi-tenancy are
shaped so the following can be layered on without rework. They are **not** in this
build:

- Postgres system-of-record (Prisma/Drizzle), tRPC/REST API, optional magic-link /
  OAuth accounts that adopt guest progress.
- Real-time **1v1 duels**, live leaderboards, matchmaking (WebSockets + Redis), Elo
  rating, tournaments & seasons.
- **Admin dashboard**: org overview, weakness heatmap by team, assignments, custom
  content editor, exportable compliance reports, audit log, org settings.
- Docker Compose for a single-tenant self-hosted deployment.

See **Architecture** below for exactly where each of these plugs in.

---

## Project structure

```
app/                       Next.js App Router
  layout.tsx               ThemeProvider + metadata
  page.tsx                 the inbox (InboxLayout)
  stats/page.tsx           personal stats
  globals.css              design tokens (Gmail/Outlook × light/dark) + email CSS

src/
  game/                    PURE, framework-free, unit-tested game logic
    types.ts               GameEmail, RedFlag, technique labels
    scoring.ts             evaluateAnswer + bonuses (speed/investigation/streak)
    xp.ts                  XP curve, levels, tiers
    badges.ts              achievement definitions (each names a real skill)
    rounds.ts              deck building (balanced, difficulty, weakness focus)
    storage.ts             local-first persistence (guest = first-class)
    __tests__/             vitest specs

  data/emails.ts           the 40+ authored, versioned seed dataset

  context/ThemeContext.tsx theme + light/dark, persisted, live-swapping
  hooks/useGame.ts         game state, scoring, stats — the useGame hook
  lib/                     format helpers + DOM highlight for evidence chips
  components/              InboxLayout, FolderRail, EmailList, ReadingPane,
                           SenderDetails, HeaderPanel, LinkInspector, LinkStatusBar,
                           AttachmentChip, ClassificationBar, FeedbackPanel,
                           RoundSummary, GameSidebar, ThemeSwitcher, TopBar,
                           Onboarding, HintBubble, ShortcutsModal, StatsView, Avatar
```

Game logic never imports React; UI never re-implements scoring. That split is what
lets the same rules run later on a server for duels and leaderboards.

---

## Adding new emails

Emails live in [`src/data/emails.ts`](src/data/emails.ts) as a typed array. The
first record (`e01`) is **fully annotated as a template**. To add one, copy the
shape:

```ts
{
  id: "e43",
  truth: "phishing",              // or "legit"
  difficulty: "medium",           // easy | medium | hard
  from: { name: "Display Name", address: "sender@domain.example" },
  replyTo: "elsewhere@other.example",   // optional — powers the reply-to tool
  to: "you@northwind.example",
  subject: "…",
  timestamp: "2026-09-02T09:00:00Z",
  snippet: "one-line preview shown in the list",
  bodyHtml: `<p>…</p><a class="btn" href="https://REAL-destination">Click</a>`,
  links: [{ text: "Click", href: "https://REAL-destination" }],
  attachments: [{ name: "file.pdf.htm", sizeKB: 40, suspicious: true, reason: "…" }],
  auth: { spf: "fail", dkim: "fail", dmarc: "fail" },  // surfaces in Show original
  firstTimeSender: true,
  mailedBy: "domain.example",
  signedBy: "—",
  redFlags: [                     // for phishing: what gave it away
    { type: "lookalike_domain", anchor: "domain.example",
      explanation: "shown in feedback; anchor is highlighted in the email" },
  ],
  legitSignals: ["…"],            // for legit: the reassuring signals instead
  techniqueTags: ["lookalike_domain"],  // drives stats + weakness practice
}
```

Key rules that make the forensic tools work:

- **`links[].href` is the _real_ destination.** Make the visible text imply the real
  portal while the href points at a lookalike — that's the hover/inspect lesson.
- **`redFlags[].anchor`** must be a substring that appears somewhere in the rendered
  email, headers, sender table, or an attachment name — the feedback chip finds it,
  scrolls to it, and flashes it.
- Give **legit** emails `legitSignals` (not `redFlags`) so feedback can reassure.
- Set `auth` to fail for spoofed mail so the header panel tells the true story.

In production this content moves into the database (`orgId | null`, `version`,
`authorId`, `published`), authored through the admin custom-content editor.

---

## Architecture & extension points

- **Soft multi-tenancy.** Every content row is designed to carry an optional
  `orgId` (`null` = the open global pool). Global play and global leaderboards are
  always available; org grouping is an overlay, not a wall.
- **Guest-first identity.** A player is a handle + an anonymous id in
  `localStorage` (`src/game/storage.ts`). Optional accounts (magic-link / OAuth) are
  meant only to persist and sync that same shape across devices — never a gate.
- **Where the backend plugs in.** `useGame` currently reads the built-in dataset and
  persists locally. Swap those two seams — the email source and `loadStats/saveStats`
  — for API calls and the same UI drives a server-backed deployment. `evaluateAnswer`
  and the round builder are already pure and server-safe for authoritative duel
  scoring.

## Privacy, security & trust

- The UI **repeatedly frames this as a training simulation** — all emails fictional
  and AI-generated, brand names for realism only. In an org deployment this policy
  banner is configurable, and scores are for learning, not punitive HR action.
- Guest data lives only in the player's browser; nothing is transmitted in this
  build. A production deployment should encrypt in transit and at rest, enforce
  strict tenant isolation, audit all admin actions, and support per-user export /
  delete (GDPR) and configurable retention — see the roadmap.

## License

Content and code are provided for security-awareness training and education.
