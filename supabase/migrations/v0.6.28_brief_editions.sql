-- ═══════════════════════════════════════════════════════════════════════
-- Vitalis Portal v0.6.28 — The Thursday Brief: edition storage
--
-- Run these in the Supabase SQL Editor on the Vita project
-- (ttojfvyfxqyzwvuzhvtd), ONE STATEMENT AT A TIME, in order.
--
-- Nothing in this migration alters an existing table, so there is no
-- rollback risk to existing data. `cf_settings.week_start_dow` is
-- deliberately NOT touched — the cashflow week stays as it is until the
-- QuickBooks and AxisCare rebuild.
-- ═══════════════════════════════════════════════════════════════════════


-- ── Statement 1 of 3 ───────────────────────────────────────────────────
-- One row per edition. `facts` holds the complete deterministic fact
-- block, so an edition can always be re-rendered exactly as it was, even
-- after the underlying records have moved on. That is the whole point of
-- an archive: last week's brief must keep saying what it said last week.

create table if not exists public.brief_editions (
  id            uuid primary key default gen_random_uuid(),
  week_key      text not null unique,
  window_start  timestamptz not null,
  window_end    timestamptz not null,
  facts         jsonb not null,
  commentary    text,
  html          text,
  status        text not null default 'draft'
                  check (status in ('draft', 'ready', 'sent', 'failed')),
  recipients    text[] not null default '{}',
  sent_at       timestamptz,
  error         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);


-- ── Statement 2 of 3 ───────────────────────────────────────────────────
-- The archive page lists newest first; this is the index that serves it.

create index if not exists brief_editions_created_idx
  on public.brief_editions (created_at desc);


-- ── Statement 3 of 3 ───────────────────────────────────────────────────
-- Force PostgREST to pick up the new table. Without this the API layer
-- keeps returning "relation does not exist" against a table that plainly
-- does exist, which is a genuinely maddening twenty minutes.

notify pgrst, 'reload schema';
