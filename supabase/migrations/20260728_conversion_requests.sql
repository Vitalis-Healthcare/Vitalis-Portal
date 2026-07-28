-- v0.6.24-b — conversion approval requests
--
-- Run as FOUR separate statements in the Supabase SQL Editor, in this order.
-- All four are also pasted inline in the chat message that shipped this ZIP.

-- ── Statement 1 of 4 ────────────────────────────────────────────────────────
create table if not exists onb_conversion_requests (
  id             uuid primary key default gen_random_uuid(),
  candidate_id   uuid not null references onb_candidates(id) on delete cascade,
  requested_by   uuid references auth.users(id),
  requested_at   timestamptz not null default now(),
  requested_note text,
  status         text not null default 'pending',
  decided_by     uuid references auth.users(id),
  decided_at     timestamptz,
  decision_note  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Statement 2 of 4 ────────────────────────────────────────────────────────
create index if not exists onb_conversion_requests_candidate_idx
  on onb_conversion_requests (candidate_id, requested_at desc);

-- ── Statement 3 of 4 ────────────────────────────────────────────────────────
-- Only ONE pending request per candidate, enforced by the database rather than
-- by the route. Two coordinators clicking at once would otherwise create two.
create unique index if not exists onb_conversion_requests_one_pending
  on onb_conversion_requests (candidate_id) where status = 'pending';

-- ── Statement 4 of 4 ────────────────────────────────────────────────────────
notify pgrst, 'reload schema';
