-- v0.6.24-a — the coordinator's "documents reviewed and accepted" sign-off
--
-- Run as TWO separate statements in the Supabase SQL Editor, in this order.
-- Both are also pasted inline in the chat message that shipped this ZIP.

-- ── Statement 1 of 2 ────────────────────────────────────────────────────────
-- All three null by default, so every candidate currently mid-flow correctly
-- reads as "not yet accepted" until someone actually looks.
alter table onb_candidates
  add column if not exists documents_accepted_at   timestamptz,
  add column if not exists documents_accepted_by   uuid references auth.users(id),
  add column if not exists documents_accepted_note text;

-- ── Statement 2 of 2 ────────────────────────────────────────────────────────
notify pgrst, 'reload schema';
