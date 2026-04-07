-- ============================================================
-- Migration 039: Add date_of_birth and zip to leads
-- Run in Supabase SQL Editor BEFORE deploying the v0.1.0 code patch.
--
-- Why this exists:
--   The leads table already has address, city, state columns from
--   migration 037 — they were just never exposed in the form UI.
--   Care coordinators flagged that they need to capture the
--   client's home address (for geocoding/matching when handed off
--   to CareMatch360) and date of birth. This adds the two missing
--   columns and indexes nothing extra (low cardinality, low query
--   pressure on these columns).
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS zip           TEXT;

-- Sanity check — surface a notice in the SQL Editor confirming both
-- columns exist after the ALTER runs.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'date_of_birth'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'zip'
  ) THEN
    RAISE NOTICE '✓ leads.date_of_birth and leads.zip are present.';
  ELSE
    RAISE EXCEPTION 'Migration 039 did not complete — missing columns.';
  END IF;
END $$;
