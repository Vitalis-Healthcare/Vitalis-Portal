-- ============================================================
-- Migration 20260806b: Consent milestone (v0.6.41)
-- Run in the VITA Supabase SQL Editor (ttojfvyfxqyzwvuzhvtd)
-- ONE STATEMENT AT A TIME. Purely additive — no backup table
-- needed: nothing existing is rewritten or destroyed.
-- ============================================================

-- [1/3] The consent milestone column.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS consent_status TEXT DEFAULT 'not_started';

-- [2/3] Existing rows start explicitly at not_started.
UPDATE leads SET consent_status = 'not_started' WHERE consent_status IS NULL;

-- [3/3] Reload the PostgREST schema cache.
NOTIFY pgrst, 'reload schema';
