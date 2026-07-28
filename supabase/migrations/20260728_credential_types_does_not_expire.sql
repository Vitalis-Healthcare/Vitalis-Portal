-- v0.6.22-b — credential types that genuinely never expire
--
-- Run as TWO separate statements in the Supabase SQL Editor, in this order.
-- Both are also pasted inline in the chat message that shipped this ZIP.

-- ── Statement 1 of 2 ────────────────────────────────────────────────────────
-- Defaults to false so every existing type keeps its current behaviour until
-- someone ticks the box. Background Check and Hep B Vaccine / Waiver are the
-- two expected to be flagged.
alter table credential_types
  add column if not exists does_not_expire boolean not null default false;

-- ── Statement 2 of 2 ────────────────────────────────────────────────────────
notify pgrst, 'reload schema';
