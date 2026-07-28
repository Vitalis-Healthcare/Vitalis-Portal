-- sql/20260728_license_waiver.sql
-- v0.6.18 — records that a candidate is an unlicensed aide, so MBON
-- verification is not required for them.
--
-- Columns rather than a table: a candidate has at most one waiver, and it is a
-- property of their credentialing state rather than an event log. Who waived it
-- and why are both stored, because a waiver is a judgement someone made and the
-- record should say who made it.
--
-- The CJIS background check has no equivalent — it is never waivable.
--
-- Run these statements ONE AT A TIME in the Supabase SQL Editor.

-- 1 of 2
alter table public.onb_candidates
  add column if not exists license_waived_at     timestamptz,
  add column if not exists license_waived_by     uuid references public.profiles(id) on delete set null,
  add column if not exists license_waiver_reason text;

-- 2 of 2
notify pgrst, 'reload schema';
