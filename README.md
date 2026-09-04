# Don't Get Phished

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

## A hosted service, free for individuals

Don't Get Phished is a **hosted SaaS**, not a self-hosted app. It runs on
**Supabase** (Postgres + Auth + email) and is layered so play never depends on the
backend:

- **Free forever for individuals.** Anyone can play instantly with no login — the
  realistic inbox and all forensic tools, solo rounds and difficulty progression,
  local gamification (XP/levels/tiers/streaks/badges), a **deterministic daily
  challenge**, personal stats, and **offline/async duels**. Progress lives in
  `localStorage`; a free **email account** (one-time code, via Supabase Auth) adds
  cross-device sync and a reserved handle.
- **Teams & Enterprise (paid).** Orgs get a join code, live **global / org
  leaderboards**, and an **admin dashboard** (weakness heatmap, per-member
  drill-down, audit log). Paid tiers unlock custom scenario content, training
  assignments, compliance exports, and — for enterprise — SSO, branding, an API,
  and higher limits. Tiers are enforced in one place (`src/server/plan.ts`).
- **Roadmap.** Real-time 1v1 matchmaking at scale (Redis-backed), seasons /
  tournaments / company challenges, SCIM, and webhooks/Slack. The seams are in
  place (see Architecture).

**Online features never gate play.** If the backend is unreachable, the UI silently
drops to guest mode and solo play, the daily challenge, and duels keep working.

> **Monetization.** Individual play is free (top-of-funnel + goodwill). Revenue
> comes from **per-seat Team/Enterprise subscriptions** with customization and
> compliance features; natural add-ons are a **managed phishing-simulation campaign
> service** for enterprises and **content/curriculum packs**.

---

## Quick start (local development)

```bash
npm install
npm run dev            # http://localhost:3000
```

The game plays immediately as a guest. With **no `.env`**, the backend runs against
a **zero-dependency local file store** (`./.data/izd-db.json`) and a **dev
magic-link** whose code is returned inline — so accounts, orgs, and leaderboards are
fully usable locally **without Supabase or any email provider**. This fallback is
for development and CI only; production always runs on Supabase.

To develop against **real Supabase**, copy `.env.example` to `.env.local`, fill in
your project's keys, and apply the schema in `supabase/migrations/` — see
[Backend & deployment](#backend--deployment).

Other scripts:

```bash
npm run build          # production build
npm run start          # run the production server
npm run lint           # eslint (next/core-web-vitals)
npm run test           # 69 unit tests (vitest)
```

Requires Node 18.18+ (developed on Node 22; see `.nvmrc`).

---

## Beyond email — every channel (`/train`)

Phishing isn't only email, so the training isn't either. A channel-agnostic
scenario framework powers four more realistic surfaces, all feeding the **same
score, XP and stats** as the inbox:

| Channel | Surface | Teaches |
| --- | --- | --- |
| **SMS / smishing** | Phone Messages app | Fake delivery/bank/refund texts, OTP theft, MFA-fatigue, short links |
| **Voice / vishing** | Incoming call & voicemail | Bank "fraud team", fake IT remote-access, robocall threats, CEO voice-cloning |
| **Chat / DM** | Slack, Teams, WhatsApp, LinkedIn | Exec gift-card fraud, IT reset lures, job scams, "hi mum" new-number |
| **QR & web** | QR scan → browser | Quishing (parking/delivery), fake login pages — read the real address bar |

Each surface has channel-appropriate **investigation tools** (reveal a link's true
destination, caller-ID caveats, a sender's real handle, the true registrable
domain) and the same three real-world actions the email game scores. The flow: a
**channel switcher** plus a **Mixed** round that changes channel every scenario —
the realistic cross-channel vigilance drill. Reached from the top-bar radar icon,
the Learn page, and the email round summary.

The engine only ever reads `truth` / `difficulty` / `techniqueTags`, so scoring, XP
and the weakness heatmap work across every channel with no special-casing
(`src/game/channels.ts`, `src/hooks/useScenarioGame.ts`, `src/data/*`).

---

## What's implemented

The **core training experience** — the ~90% of the product players actually touch —
is complete and runnable:

- **Pixel-realistic mail client** with a **Gmail** theme (default) and a switchable
  **Outlook** theme, plus **light/dark** mode. Themes swap live via a CSS-variable
  design-token layer — no reload, no lost game state. Generic product name
  ("Don't Get Phished") and a neutral shield mark; no trademarked logos.
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
- **Real Gmail/Outlook actions** for muscle memory — instead of an abstract
  "phishing/legit" toggle, you take the *actual* actions you'd use in your own inbox:
  **Report** (toolbar "Report ▾" → phishing/junk, the ⋮ menu, or the action bar),
  **Archive** (keep — it's safe), or **Delete** — with the real client keys
  **`!` report · `E` archive · `#` delete**. Scoring is graded to teach the right
  habit: **report the phish / keep the safe mail** earns the most (a report/keep
  action bonus); **Delete** is correct-but-suboptimal (~half points, with coaching);
  reporting real mail is a false positive and archiving a phish is a false negative.
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
- **The Aftermath** (`/aftermath`): an interactive, clearly-labelled simulation of
  what happens *after* a click — a neutral, **inert** fake login (nothing typed is
  ever sent, stored, or transmitted) flips into an attacker's-console reveal of the
  captured credentials, then a step-by-step 24-hour damage timeline (mail-rule,
  password resets, MFA fatigue, invoice fraud, data exfiltration, spreading to
  contacts, ransomware), an impact summary with illustrative figures (FBI IC3 / IBM /
  Verizon DBIR / FTC), and a defensive turnaround. It's linked from the Learn page and
  surfaced right when a player *misses* a credential-harvest phish ("You would have
  clicked — see what a real attacker does next").
- **Personal stats** page: lifetime accuracy, best streak, tier/level, a
  **technique-by-technique heatmap**, FP/FN distribution, and a **badge gallery**.
- **Onboarding wizard** — a skippable, replayable "How to play" walkthrough (goal →
  layout → the forensic tools → how to decide → feedback/scoring → compete → go
  deeper) with Back/Next, progress, keyboard nav, and small inline visuals; replay it
  any time from the account menu ("How to play", `/?intro=1`). Plus a one-time
  contextual **hint bubble** and a **keyboard shortcuts** modal (`?`).
- **Accessibility**: full keyboard play (`!`/`E`/`#` real-client actions, `Enter`/`↑`/`↓`/`H`/`S`/`?`),
  visible focus states, ARIA roles/labels, and `prefers-reduced-motion` support.
- **40+ authored emails** across easy/medium/hard, balanced phishing/legit, covering
  every technique in the brief.

### Backend status

**Built in this repo** (see [Backend & deployment](#backend--deployment)):
email-based accounts (Supabase Auth, one-time code) with guest-progress adoption + cross-device sync; REST
API; global/org leaderboards (weekly/seasonal/all-time); orgs via join code; an
admin dashboard (overview, weakness heatmap, per-member drill-down, audit log); a
**custom-content editor** (author org-specific scenario emails with a live preview
and publish/version control, sanitised server-side and served into members' rounds);
and **assignments** (difficulty/technique focus + accuracy target + due date, with
completion tracked from rounds and surfaced to players in the inbox);
**exportable compliance reports** (per-member status, assignment completion,
technique coverage and an audit log as CSV, plus a printable PDF summary); and
**real-time online 1v1 matchmaking** (get matched with another live player, race the
same seeded deck with server-authoritative scoring and Elo, with the bot as an
offline fallback). Runs on **Supabase** (Postgres + Auth + email) in production,
with a zero-dependency file store for local dev / CI.

**Remaining roadmap** — the seams are in place:

- Seasons, tournaments, company challenges (round events + timeframe windows are
  already the substrate).
- Plan-based billing (Stripe) wired to `src/server/plan.ts`; SSO/SCIM,
  webhooks/SIEM/LMS, Slack/Teams hooks (enterprise tier).
- Multi-node matchmaking: the live-match hub is in-memory (correct for one node);
  moving it to Redis is the only change for horizontal scale.

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
    store.ts               *** the GameStore interface + localStore (persistence seam) ***
    __tests__/             vitest specs

  data/emails.ts           the 40+ authored, versioned seed dataset

  server/                  BACKEND — the Repository seam + pure logic
    repository.ts          the datastore interface (one seam for all persistence)
    supabaseRepository.ts  production store (Supabase / Postgres)
    jsonRepository.ts      local dev / CI store (file-backed, zero-dependency)
    supabase.ts            Supabase client factories (auth + service role)
    config.ts              env-driven driver + auth-provider selection
    plan.ts                plan-based feature gating (free / team / enterprise)
    db.ts                  driver selection (supabase | json)
    auth.ts                Supabase Auth in prod; dev magic-link fallback
    leaderboard.ts         PURE ranking / timeframe / weakness-heatmap (tested)
    assignments.ts         PURE assignment-completion logic (tested)
    content.ts             PURE email validation + HTML sanitisation (tested)
    importEmail.ts         PURE defang + parse for safe real-email import (tested)
    reports.ts             PURE CSV serialisation + report builders (tested)
    duelHub.ts             in-memory live-match manager (matchmaking, scoring)
    duelFinalize.ts        one-time Elo application on match finish
    guard.ts               requireOrgAdmin / requireMember helpers
    types.ts, ids.ts, http.ts
  net/                     client-side backend integration (offline-first)
    api.ts                 typed fetch client (fails soft with no backend)
    session.tsx            SessionProvider: auth + two-way stat sync overlay

  context/ThemeContext.tsx theme + light/dark, persisted, live-swapping
  hooks/useGame.ts         solo/daily game state, scoring, stats
  hooks/useDuel.ts         offline bot-duel state (deck, bot, live score, rating)
  hooks/useOnlineDuel.ts   online duel: matchmaking + live race via the API
  lib/                     format helpers + DOM highlight for evidence chips
  components/LearnView.tsx real anti-phishing tools + the spot-the-phish checklist
  components/AftermathSim.tsx  "The Aftermath" attacker's-side consequence sim
  data/aftermath.ts        scenarios + illustrative impact figures for the sim
  components/online/       LeaderboardView, OrgsView, AdminView, ContentAdmin,
                           AssignmentsAdmin, ReportsAdmin, PrintReport, PageShell
  components/              InboxLayout, FolderRail, EmailList, ReadingPane,
                           EmailMessage (shared realistic email + tools),
                           SenderDetails, HeaderPanel, LinkInspector, LinkStatusBar,
                           AttachmentChip, ClassificationBar, FeedbackPanel,
                           RoundSummary, GameSidebar, ThemeSwitcher, TopBar,
                           Onboarding, HintBubble, ShortcutsModal, StatsView,
                           AccountMenu, Avatar
    components/duel/       DuelScreen, DuelLobby, DuelArena, DuelResult, DuelBar,
                           DuelStage (shared arena), OnlineDuel (matchmaking + race)

app/api/                   route handlers: auth/*, sync, rounds, leaderboard,
                           orgs, orgs/join, content, assignments, duel/* (queue +
                           match answer/forfeit), admin/overview, admin/content*,
                           admin/assignments*, admin/report
middleware.ts              security headers (CSP, HSTS, frame-ancestors, …)
supabase/migrations/       Postgres schema + RLS policies
```

Game logic never imports React; UI never re-implements scoring. That split — plus
the single `GameStore` seam for all persistence — is what lets the same rules run
later on a server for live duels and leaderboards.

---

## Backend & deployment

Production runs on **Supabase** (Postgres + Auth + email). Both datastore drivers
implement the **same `Repository` interface** (`src/server/repository.ts`), and the
active driver + auth provider are selected automatically from the environment
(`src/server/config.ts`):

| Environment | Datastore | Auth | Selected when |
| --- | --- | --- | --- |
| **Production** | Supabase (Postgres) | Supabase Auth (email OTP) | Supabase env vars present |
| **Local dev / CI** | `./.data/izd-db.json` (file store) | dev magic-link (code returned inline) | Supabase env vars absent |

**Deploying on Supabase:**

1. Create a Supabase project. From **Settings → API** copy the project URL, the
   `anon` public key, and the `service_role` secret key.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` in your host's environment (see `.env.example`).
3. Apply the schema + RLS policies in `supabase/migrations/0001_init.sql` (via the
   Supabase SQL editor or `supabase db push`).
4. In **Authentication → URL Configuration**, add your deployed origin and
   `/auth/callback` as a redirect URL. The default magic-link email works out of the
   box; to also support pasting a code, enable `{{ .Token }}` in the email template.
5. `npm run build && npm run start` behind HTTPS.

Data is accessed **server-side** via the service-role key; the browser only uses
Supabase for auth. RLS is enabled on every table as defense-in-depth (see the
migration). No self-hosting, Prisma, or Docker is involved.

**What the backend adds** (all gated so guests are never blocked):

- **Email accounts** (`/api/auth/*`) — no passwords. In production Supabase Auth
  emails a one-time code / magic link; locally (no Supabase) a dev code is returned
  inline so the flow works with no mail provider. Same two-step UX either way.
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
  challenge, which stays globally deterministic). Admins can also **import a real
  email** (`/api/admin/content/import`) through a defang pipeline — see
  [Using real phishing emails safely](#using-real-phishing-emails-safely).
- **Assignments** (`/api/admin/assignments*` + `/api/assignments`) — assign a
  difficulty / technique focus / accuracy target / due date to the whole org or a
  team; completion is computed from members' round events and shown to admins
  (per-assignment progress) and to players (an inbox banner with a "Train now"
  shortcut that starts a matching round).
- **Real-time online duels** (`/api/duel/*`) — matchmaking pairs two waiting players
  into a match on a shared seed; both build the identical deck client-side and race,
  with the server holding authoritative per-email scores (via the same pure
  `duelPointsFor`) and applying **Elo** on finish. Live opponent progress is polled
  (SSE is the drop-in upgrade); disconnects resolve via a grace-period forfeit; and
  when no human is waiting the player drops to the always-available **bot** — so
  duels work with or without an opponent, online or off.
- **Compliance reports** (`/api/admin/report`, role-gated) — audit-ready CSV exports
  (per-member training status, assignment completion, technique coverage, and the
  audit log) plus a **printable PDF summary** (`/admin/print`, save-as-PDF from the
  browser). Reports honour the org's leaderboard privacy setting.

**Security model.** In production, sessions are **Supabase Auth** (JWT session
cookies managed by `@supabase/ssr`); the dev fallback uses stateless HMAC-signed
cookies and single-use, time-boxed magic tokens (the server hard-fails if the dev
auth runs in production without a strong `AUTH_SECRET`). Every response carries a
strict **CSP** and the usual security headers (`middleware.ts`). Admin routes verify
`org_admin` membership server-side (a non-admin gets `403`). Round submissions are
clamped and only accept an `orgId` the caller belongs to. Postgres tables have
**RLS** enabled (defense-in-depth); paid features are gated in `src/server/plan.ts`.
Leaderboard display honours a per-org privacy setting (real name / handle /
anonymous).

## Using real phishing emails safely

Real phishing samples make powerful training — but real emails carry **live
malicious URLs, tracking beacons, malware attachments, victims' personal data, and
trademarked brands**, so they must never be rendered as-is. This project takes the
safe path: it does **not** bundle real datasets or auto-scrape live feeds. Instead an
org admin can **import** a sample through a defang pipeline (Admin → Custom content →
**Import real email**), which:

- runs the same server-side sanitiser (removes `<script>`, inline handlers,
  `javascript:` URIs),
- **defangs remote resources** — images/beacons/media are blocked so opening the
  message can't phone home,
- **keeps link text + destinations** (that mismatch is the lesson) — the reading pane
  never navigates, so those hrefs stay inert,
- **drops the real recipient** and lightly **redacts** long digit runs (card/SSN-like),
- produces an **unpublished draft** a human reviews, tags with red flags, and
  publishes — never auto-live.

Suitable **free sources** to draw samples from (verify each one's licence yourself,
and strip/booby-trap-check before publishing):

| Source | Contents | Notes |
| --- | --- | --- |
| Apache **SpamAssassin** public corpus | ham + spam | Public, widely used for research |
| **Nazario** Phishing Corpus | phishing emails | Research use; check terms |
| **PhishTank** / **OpenPhish** (community feeds) | phishing **URLs** | Great for the link lessons; respect API terms |
| **Enron** email dataset | legitimate mail | Good *legit* examples to balance the deck |
| Kaggle "phishing email" datasets | labelled emails | Licence varies per dataset — read it |

**Your responsibilities when importing:** confirm you're licensed to use the sample;
remove or genericise **trademarked brand names** if you deploy publicly; ensure no
**personal data** survives (the pipeline helps but is not a legal guarantee); and keep
a human in the loop. The built-in seed set stays fully fictional so the repo ships
clean.

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
  `localStorage` (`src/game/storage.ts`). Optional email accounts (Supabase Auth) are
  meant only to persist and sync that same shape across devices — never a gate.
- **Offline-first client + additive sync overlay.** Local play stays authoritative
  through `src/game/store.ts` (`GameStore`/`localStore`) — no network on the critical
  path. `src/net/session.tsx` is the overlay: on sign-in it pushes local stats up and
  merges the server's down (monotonic max), and after each round it fires the result
  to `/api/rounds`. Every online surface fails soft, so removing the backend just
  hides those features.
- **Server `Repository` seam (the one thing the datastore swaps).** All server
  persistence goes through `src/server/repository.ts`. Production uses
  `supabaseRepository` (Postgres); local dev / CI use the file-backed
  `jsonRepository`. The driver is chosen automatically from the environment
  (`src/server/config.ts`) — no API or UI changes.
- **One duel engine, two transports.** A duel is fully described by a compact
  **challenge code** (`v1-<seed>-<size>-<diff>`); `buildDuelDeck`, `simulateBot`, and
  the scoring functions are pure and deterministic. The offline bot duel and the
  online matchmade duel run the *same* seed → deck → score pipeline — only *who you
  race* differs (a local bot vs a server-paired human), and the server reuses
  `duelPointsFor` for authoritative online scoring. `DuelStage` is the shared arena UI
  for both.
- **Determinism.** `rng.ts` (seeded mulberry32 + FNV-1a) powers both the daily
  challenge (seeded by date) and duels (seeded by challenge code), guaranteeing every
  player gets an identical set — a property the backend can trust and reproduce.

## Privacy, security & trust

- The UI **repeatedly frames this as a training simulation** — all emails fictional
  and AI-generated, brand names for realism only. In an org deployment this policy
  banner is configurable, and scores are for learning, not punitive HR action.
- Guest data lives only in the player's browser; signing in syncs stats to
  Supabase (Postgres), which encrypts data in transit and at rest and provides
  managed backups. Admin actions are audited; RLS enforces tenant isolation as
  defense-in-depth. Per-user export / delete (GDPR) and configurable retention are
  on the roadmap.

## License

Content and code are provided for security-awareness training and education.
