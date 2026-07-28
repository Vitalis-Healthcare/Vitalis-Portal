-- v0.6.22-c — allow a seeded credential to exist before its dates are known
--
-- Run as TWO separate statements in the Supabase SQL Editor, in this order.
-- Both are also pasted inline in the chat message that shipped this ZIP.

-- ── Statement 1 of 2 ────────────────────────────────────────────────────────
-- A credential seeded on conversion carries the dates printed on the document
-- when we have them, and NOTHING when we do not. Defaulting issue_date to the
-- upload date would put a fabricated fact into a compliance record.
alter table staff_credentials alter column issue_date drop not null;

-- ── Statement 2 of 2 ────────────────────────────────────────────────────────
notify pgrst, 'reload schema';
