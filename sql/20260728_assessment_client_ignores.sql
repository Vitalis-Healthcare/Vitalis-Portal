-- sql/20260728_assessment_client_ignores.sql
-- v0.6.16 — permanent "do not import" list for AxisCare clients.
--
-- Keyed on axiscare_id (text) rather than a FK to assessment_clients, because
-- an ignored client never gets an assessment_clients row at all.
--
-- RLS is enabled with NO policies: server-role only, same pattern as
-- portal_settings (v0.6.12). All reads/writes go through createServiceClient().
--
-- Run these statements ONE AT A TIME in the Supabase SQL Editor.

-- 1 of 3
create table if not exists public.assessment_client_ignores (
  axiscare_id text primary key,
  full_name   text,
  reason      text,
  ignored_by  uuid references public.profiles(id) on delete set null,
  ignored_at  timestamptz not null default now()
);

-- 2 of 3
alter table public.assessment_client_ignores enable row level security;

-- 3 of 3
notify pgrst, 'reload schema';
