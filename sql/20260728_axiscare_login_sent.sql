-- sql/20260728_axiscare_login_sent.sql
-- v0.6.19 — records when the AxisCare sign-in instructions were emailed.
--
-- One column, not a table: a caregiver is sent these once (occasionally twice
-- if they lose the email), and what matters operationally is only whether it
-- has gone out. The button reads it to decide between "Send" and "Resend".
--
-- Run these statements ONE AT A TIME in the Supabase SQL Editor.

-- 1 of 2
alter table public.onb_candidates
  add column if not exists axiscare_login_sent_at timestamptz;

-- 2 of 2
notify pgrst, 'reload schema';
