-- sql/20260728_onb_contracts.sql
-- v0.6.17 — candidate agreements (job description + acknowledgment).
--
-- Templates live in code (lib/onboarding/contract-templates.ts). What lands
-- here is the issued agreement and, once signed, a snapshot of the exact HTML
-- the person saw — so amending a template can never retroactively change what
-- somebody already agreed to.
--
-- sign_token holds the SHA-256 HASH of the raw token; the raw value exists only
-- in the emailed URL (same rule as onb_candidates.access_token).
--
-- RLS enabled with no policies: service-role only. The public signing page
-- reaches these rows through token-validated server code, never the anon client.
--
-- Run these statements ONE AT A TIME in the Supabase SQL Editor.

-- 1 of 5
create table if not exists public.onb_contracts (
  id               uuid primary key default gen_random_uuid(),
  candidate_id     uuid not null references public.onb_candidates(id) on delete cascade,
  template_key     text not null,
  template_version text not null,
  position_title   text not null,
  pay_rate         text not null,
  sign_token       text not null,
  token_expires_at timestamptz not null,
  sent_at          timestamptz not null default now(),
  sent_by          uuid references public.profiles(id) on delete set null,
  signed_at        timestamptz,
  signature_name   text,
  signature_ip     text,
  rendered_html    text,
  created_at       timestamptz not null default now()
);

-- 2 of 5
create unique index if not exists onb_contracts_sign_token_idx
  on public.onb_contracts (sign_token);

-- 3 of 5
create index if not exists onb_contracts_candidate_idx
  on public.onb_contracts (candidate_id, sent_at desc);

-- 4 of 5
alter table public.onb_contracts enable row level security;

-- 5 of 5
notify pgrst, 'reload schema';
