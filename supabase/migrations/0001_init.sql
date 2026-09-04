-- Don't Get Phished — initial schema.
--
-- Data is accessed server-side through the service-role key (see
-- src/server/supabaseRepository.ts), which bypasses RLS; every /api route enforces
-- its own authz before touching the DB, and the browser never queries these tables
-- directly (it uses Supabase only for email-OTP auth). RLS is nonetheless enabled
-- on every table as defense-in-depth: with no permissive policy for the anon /
-- authenticated roles, a leaked anon key cannot read or write app data. A few
-- self-scoped read policies are added to document intent and enable safe direct
-- reads later.

-- Profiles mirror auth.users (id === auth uid). Created on first sign-in.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  handle      text not null,
  email       text,
  created_at  timestamptz not null default now()
);
create unique index if not exists profiles_handle_lower_idx on public.profiles (lower(handle));
create unique index if not exists profiles_email_lower_idx on public.profiles (lower(email));

create table if not exists public.orgs (
  id          text primary key,
  name        text not null,
  join_code   text not null,
  created_at  timestamptz not null default now(),
  settings    jsonb not null default '{}'::jsonb,
  plan        text not null default 'free'
);
create unique index if not exists orgs_join_code_lower_idx on public.orgs (lower(join_code));

create table if not exists public.memberships (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  org_id     text not null references public.orgs (id) on delete cascade,
  role       text not null default 'player',
  team       text,
  joined_at  timestamptz not null default now(),
  primary key (user_id, org_id)
);
create index if not exists memberships_org_idx on public.memberships (org_id);

create table if not exists public.stats (
  user_id           uuid primary key references public.profiles (id) on delete cascade,
  xp                integer not null default 0,
  total_answered    integer not null default 0,
  total_correct     integer not null default 0,
  false_positives   integer not null default 0,
  false_negatives   integer not null default 0,
  best_streak       integer not null default 0,
  technique_seen    jsonb not null default '{}'::jsonb,
  technique_caught  jsonb not null default '{}'::jsonb,
  last_active       timestamptz not null default now()
);

create table if not exists public.round_events (
  id                text primary key,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  org_id            text references public.orgs (id) on delete set null,
  at                timestamptz not null default now(),
  difficulty        text not null,
  total             integer not null,
  correct           integer not null,
  points            integer not null,
  false_positives   integer not null default 0,
  false_negatives   integer not null default 0,
  technique_seen    jsonb not null default '{}'::jsonb,
  technique_caught  jsonb not null default '{}'::jsonb
);
create index if not exists round_events_org_at_idx on public.round_events (org_id, at);
create index if not exists round_events_user_idx on public.round_events (user_id);

create table if not exists public.emails (
  id          text primary key,
  org_id      text not null references public.orgs (id) on delete cascade,
  author_id   uuid references public.profiles (id) on delete set null,
  version     integer not null default 1,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  data        jsonb not null
);
create index if not exists emails_org_idx on public.emails (org_id);

create table if not exists public.assignments (
  id               text primary key,
  org_id           text not null references public.orgs (id) on delete cascade,
  created_by       uuid references public.profiles (id) on delete set null,
  title            text not null,
  difficulty       text not null,
  focus_technique  text,
  min_accuracy     real not null default 0,
  min_rounds       integer not null default 0,
  team             text,
  due_date         timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists assignments_org_idx on public.assignments (org_id);

create table if not exists public.duel_ratings (
  user_id  uuid primary key references public.profiles (id) on delete cascade,
  rating   integer not null default 1000,
  wins     integer not null default 0,
  losses   integer not null default 0,
  draws    integer not null default 0
);

create table if not exists public.audit (
  id        text primary key,
  org_id    text not null references public.orgs (id) on delete cascade,
  actor_id  uuid references public.profiles (id) on delete set null,
  action    text not null,
  detail    text not null default '',
  at        timestamptz not null default now()
);
create index if not exists audit_org_at_idx on public.audit (org_id, at);

-- Enable RLS everywhere. Service role bypasses these; anon/authenticated get only
-- the self-scoped reads declared below.
alter table public.profiles      enable row level security;
alter table public.orgs          enable row level security;
alter table public.memberships   enable row level security;
alter table public.stats         enable row level security;
alter table public.round_events  enable row level security;
alter table public.emails        enable row level security;
alter table public.assignments   enable row level security;
alter table public.duel_ratings  enable row level security;
alter table public.audit         enable row level security;

-- A signed-in user may read their own profile / stats / rating.
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists stats_self_read on public.stats;
create policy stats_self_read on public.stats
  for select to authenticated using (user_id = auth.uid());

drop policy if exists duel_ratings_self_read on public.duel_ratings;
create policy duel_ratings_self_read on public.duel_ratings
  for select to authenticated using (user_id = auth.uid());

-- A signed-in user may read their own memberships.
drop policy if exists memberships_self_read on public.memberships;
create policy memberships_self_read on public.memberships
  for select to authenticated using (user_id = auth.uid());
