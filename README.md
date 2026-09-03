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

## Built in two phases

- **Phase 1 — offline-first game.** Everything runs in the browser with progress in
  `localStorage`: the realistic inbox and all forensic tools, solo rounds and
  difficulty progression, local gamification (XP/levels/tiers/streaks/badges), a
  **deterministic daily challenge** (same for everyone on a date), personal stats,
  and **offline/async duels** — a shareable challenge link + tunable bot. Works with
  no backend and no login.
- **Phase 2 — the hosted backend (in this build).** Adds, as an **additive sync
  overlay** on top of the offline-first game: optional **magic-link accounts** with
  **guest-progress adoption** and cross-device merge; live **global / org
  leaderboards** (ranked by accuracy-scaled score); **orgs via join code**; and an
  **admin dashboard** with a weakness heatmap, per-member drill-down, and audit log.
  It self-hosts **free with no database** (a file-backed store) and offers a
  **Postgres** path for enterprises who want to own their data. See
  [Backend & self-hosting](#backend--self-hosting).
- **Phase 2b (remaining roadmap).** Real-time 1v1 matchmaking over websockets,
  seasons/tournaments/company challenges, SSO/SCIM, and webhooks/Slack. The seams
  for these are in place (see Architecture).

The whole point of the split: **online features never gate play.** If the backend
is unreachable (or you deploy frontend-only), the UI silently drops to guest mode
and solo play, the daily challenge, and duels keep working.

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

That's it — the game plays immediately as a guest, and the backend runs against a
**local file store** (`./.data/izd-db.json`) with **no database to set up**. Sign in
from the account menu (top-right); in dev the magic-link code is returned inline so
the flow is fully usable without an email provider.

Production (free, self-hosted, no database):

```bash
npm run build
npm run start          # Node server with the backend on, data in ./.data
```

Other scripts:

```bash
npm run lint           # eslint (next/core-web-vitals)
npm run test           # 49 unit tests (game logic + server: leaderboard,
                       #   assignments, content sanitisation) (vitest)
```

Requires Node 18.18+ (developed on Node 22). For the enterprise Postgres path and
Docker, see [Backend & self-hosting](#backend--self-hosting).

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
- **Daily challenge** (`/`, the "Daily" pill): a curated 8-email set derived
  deterministically from the calendar day, so it's **the same for everyone that
  day**. First completion of the day is recorded.
- **Duels — offline / async** (`/duel`): quick-match a **tunable bot** (Rookie /
  Analyst / Threat Hunter), or **"Challenge a coworker"** via a shareable link that
  encodes a seed + settings so **both players get the identical email sequence** and
  compare scores locally. Live versus-bar (opponent progress, per-email timer),
  correctness-first scoring where a wrong call costs more than a slow-but-right one,
  a local rating/record, and a **post-match side-by-side review** of every email.
- **Personal stats** page: lifetime accuracy, best streak, tier/level, a
  **technique-by-technique heatmap**, FP/FN distribution, and a **badge gallery**.
- **Onboarding** (3 skippable cards), a one-time contextual **hint bubble**, and a
  **keyboard shortcuts** modal (`?`).
- **Accessibility**: full keyboard play (`P`/`L`/`Enter`/`↑`/`↓`/`H`/`S`/`?`),
  visible focus states, ARIA roles/labels, and `prefers-reduced-motion` support.
- **40+ authored emails** across easy/medium/hard, balanced phishing/legit, covering
  every technique in the brief.

### Phase 2 status

**Built in this repo** (see [Backend & self-hosting](#backend--self-hosting)):
optional magic-link accounts with guest-progress adoption + cross-device sync; REST
API; global/org leaderboards (weekly/seasonal/all-time); orgs via join code; an
admin dashboard (overview, weakness heatmap, per-member drill-down, audit log); a
**custom-content editor** (author org-specific scenario emails with a live preview
and publish/version control, sanitised server-side and served into members' rounds);
and **assignments** (difficulty/technique focus + accuracy target + due date, with
completion tracked from rounds and surfaced to players in the inbox). A file-backed
free datastore and a committed Postgres/Docker path.

**Remaining (Phase 2b)** — the seams are in place:

- **Real-time 1v1 matchmaking** over websockets — the same pure `buildDuelDeck`
  / `simulateBot` / duel-scoring used by offline duels becomes authoritative
  server-side scoring; only the transport (who you race) changes.
- Seasons, tournaments, company challenges (round events + timeframe windows are
  already the substrate).
- Exportable compliance reports (CSV/PDF) from the assignment + round data.
- SSO/SCIM, webhooks/SIEM/LMS, Slack/Teams hooks.

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
    rng.ts                 seeded PRNG + hashing (deterministic decks)
    daily.ts               deterministic daily-challenge deck from the date
    duel.ts                challenge-code encode/decode, deck, bot, duel scoring
    storage.ts             local-first stats persistence (guest = first-class)
    store.ts               *** the GameStore interface + localStore (Phase 2 seam) ***
    __tests__/             vitest specs

  data/emails.ts           the 40+ authored, versioned seed dataset

  server/                  BACKEND (Phase 2) — the Repository seam + pure logic
    repository.ts          the datastore interface (one seam for all persistence)
    jsonRepository.ts      default file-backed store (free, zero-dependency)
    db.ts                  driver selection (json | prisma)
    auth.ts                HMAC session cookies + magic-link tokens
    leaderboard.ts         PURE ranking / timeframe / weakness-heatmap (tested)
    assignments.ts         PURE assignment-completion logic (tested)
    content.ts             PURE email validation + HTML sanitisation (tested)
    guard.ts               requireOrgAdmin / requireMember helpers
    types.ts, ids.ts, http.ts
  net/                     client-side backend integration (offline-first)
    api.ts                 typed fetch client (fails soft with no backend)
    session.tsx            SessionProvider: auth + two-way stat sync overlay

  context/ThemeContext.tsx theme + light/dark, persisted, live-swapping
  hooks/useGame.ts         solo/daily game state, scoring, stats
  hooks/useDuel.ts         duel state (deck, bot, live score, rating)
  lib/                     format helpers + DOM highlight for evidence chips
  components/online/       LeaderboardView, OrgsView, AdminView, ContentAdmin,
                           AssignmentsAdmin, PageShell
  components/              InboxLayout, FolderRail, EmailList, ReadingPane,
                           EmailMessage (shared realistic email + tools),
                           SenderDetails, HeaderPanel, LinkInspector, LinkStatusBar,
                           AttachmentChip, ClassificationBar, FeedbackPanel,
                           RoundSummary, GameSidebar, ThemeSwitcher, TopBar,
                           Onboarding, HintBubble, ShortcutsModal, StatsView,
                           AccountMenu, Avatar
    components/duel/       DuelScreen, DuelLobby, DuelArena, DuelResult, DuelBar

app/api/                   route handlers: auth/*, sync, rounds, leaderboard,
                           orgs, orgs/join, content, assignments,
                           admin/overview, admin/content*, admin/assignments*
prisma/schema.prisma       enterprise Postgres target (mirrors the Repository)
docker-compose.yml         app + Postgres + Redis stack
```

Game logic never imports React; UI never re-implements scoring. That split — plus
the single `GameStore` seam for all persistence — is what lets the same rules run
later on a server for live duels and leaderboards.

---

## Backend & self-hosting

The backend is **optional and offline-first**. It self-hosts three ways:

| Mode | Command | Data | For |
| --- | --- | --- | --- |
| **Free / no DB** (default) | `npm run build && npm run start` | `./.data/izd-db.json` (file store) | Individuals, small teams, self-hosters |
| **Docker (with Postgres+Redis)** | `docker compose up --build` | Postgres volume | Teams who want a stack |
| **Enterprise / own DB** | set `DATABASE_DRIVER=prisma` + `DATABASE_URL` | Your Postgres | Orgs that must control their data |

All three implement the **same `Repository` interface** (`src/server/repository.ts`).
The default `jsonRepository` needs zero dependencies; the enterprise path uses the
committed `prisma/schema.prisma` (implement `src/server/prismaRepository.ts` against
it and flip `DATABASE_DRIVER`). Copy `.env.example` to `.env` to configure
`AUTH_SECRET`, the driver, and the (optional) email provider.

**What the backend adds** (all gated so guests are never blocked):

- **Magic-link accounts** (`/api/auth/*`) — no passwords, no SSO required. In dev
  (no mail provider) the login code is returned inline; wire an email sender and set
  `EMAIL_ENABLED=1` for production.
- **Guest-progress adoption + cross-device sync** — on sign-in, local stats are
  pushed up and merged with the server via a monotonic element-wise max, so nothing
  is lost or double-counted.
- **Leaderboards** (`/api/leaderboard`) — Global and Org scopes × Weekly / Seasonal /
  All-time, ranked by **points scaled by accuracy** (grinding easy emails can't top a
  careful expert); accuracy and false-positive rate shown alongside; your own rank is
  always returned even when off-screen. Live-ish via polling (SSE is the drop-in
  upgrade).
- **Orgs via join code** (`/api/orgs`, `/api/orgs/join`) — create an org in a minute
  (creator becomes `org_admin`), grow it by sharing `PHISH-XXXXXX`. `orgId` on every
  round event keeps org data isolated; the global pool is always available too.
- **Admin dashboard** (`/api/admin/overview`, role-gated) — org overview,
  **weakness heatmap** (which techniques the workforce misses most), per-member
  drill-down with a constructive "needs practice" flag, and an audit log.
- **Custom-content editor** (`/api/admin/content*`, role-gated) — org admins author
  scenario emails against the same schema employees play, with a **live preview**
  that renders exactly as members will see it, draft/publish state, and versioning.
  Bodies are **sanitised server-side** (scripts/handlers/`javascript:` stripped)
  because published content renders for every member. Published emails are served to
  members (`/api/content`) and folded into their practice rounds (never the daily
  challenge, which stays globally deterministic).
- **Assignments** (`/api/admin/assignments*` + `/api/assignments`) — assign a
  difficulty / technique focus / accuracy target / due date to the whole org or a
  team; completion is computed from members' round events and shown to admins
  (per-assignment progress) and to players (an inbox banner with a "Train now"
  shortcut that starts a matching round).

**Security model.** Sessions are stateless **HMAC-signed cookies** (`AUTH_SECRET`);
magic tokens are single-use and time-boxed. Admin routes verify `org_admin`
membership server-side (a non-admin gets `403`). Round submissions are clamped and
only accept an `orgId` the caller belongs to. Leaderboard display honours a
per-org privacy setting (real name / handle / anonymous). Set a strong `AUTH_SECRET`
and serve over HTTPS in production.

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
- **Offline-first client + additive sync overlay.** Local play stays authoritative
  through `src/game/store.ts` (`GameStore`/`localStore`) — no network on the critical
  path. `src/net/session.tsx` is the overlay: on sign-in it pushes local stats up and
  merges the server's down (monotonic max), and after each round it fires the result
  to `/api/rounds`. Every online surface fails soft, so removing the backend just
  hides those features.
- **Server `Repository` seam (the one thing the datastore swaps).** All server
  persistence goes through `src/server/repository.ts`. The default `jsonRepository`
  is file-backed and free; enterprises implement the same interface over
  Prisma/Postgres and flip `DATABASE_DRIVER` — no API or UI changes.
- **Duels are already server-shaped.** A duel is fully described by a compact
  **challenge code** (`v1-<seed>-<size>-<diff>`). `buildDuelDeck`, `simulateBot`, and
  the duel scoring functions are pure and deterministic, so the exact same seed →
  deck → score pipeline becomes authoritative server-side scoring for real-time
  matchmaking in Phase 2 — only *who you race* changes, not the game.
- **Determinism.** `rng.ts` (seeded mulberry32 + FNV-1a) powers both the daily
  challenge (seeded by date) and duels (seeded by challenge code), guaranteeing every
  player gets an identical set — a property the backend can trust and reproduce.

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
