-- 0004_cashflow_v040.sql
-- Vitalis Portal Cashflow v0.4.0 schema additions
-- Run in Supabase SQL editor, one statement at a time if preferred.

-- 1. Soft-delete column on transactions
ALTER TABLE cf_transactions
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Partial index for fast active-row scans
CREATE INDEX IF NOT EXISTS cf_transactions_active_idx
  ON cf_transactions (txn_date)
  WHERE deleted_at IS NULL;

-- 3. Index on weekly actuals by week ending (for variance lookups)
CREATE INDEX IF NOT EXISTS cf_weekly_actuals_week_ending_idx
  ON cf_weekly_actuals (week_ending DESC);

-- 4. Ensure cf_weekly_actuals has the columns the variance UI expects.
--    (No-op if already present from 0003.)
ALTER TABLE cf_weekly_actuals
  ADD COLUMN IF NOT EXISTS actual_closing numeric(14,2),
  ADD COLUMN IF NOT EXISTS entered_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS entered_by text;
