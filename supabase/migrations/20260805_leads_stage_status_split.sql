-- ============================================================
-- Migration 20260805: Leads stage/status split (v0.6.38)
-- Run in the VITA Supabase SQL Editor (ttojfvyfxqyzwvuzhvtd)
-- ONE STATEMENT AT A TIME. Statements are numbered and separated.
--
-- One column did three jobs (journey stage, outcome, archive flag).
-- After this migration:
--   stage       — where in the journey (uses lead_stages)
--   status      — ongoing | standby | won | lost | cancelled
--   archived_at — a timestamp; the archive is not a status
-- legacy_status preserves every row's exact pre-migration value.
-- ============================================================

-- [1/11] Backup snapshot before anything is rewritten.
CREATE TABLE leads_backup_20260805 AS SELECT * FROM leads;

-- [2/11] New columns (single ALTER, additive, no data touched).
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS stage                 TEXT,
  ADD COLUMN IF NOT EXISTS legacy_status         TEXT,
  ADD COLUMN IF NOT EXISTS standby_until         DATE,
  ADD COLUMN IF NOT EXISTS standby_reason        TEXT,
  ADD COLUMN IF NOT EXISTS lost_reason_code      TEXT,
  ADD COLUMN IF NOT EXISTS close_probability     INTEGER,
  ADD COLUMN IF NOT EXISTS archived_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS secondary_assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- [3/11] Preserve every row's exact pre-migration status. Nothing is lost.
UPDATE leads SET legacy_status = status WHERE legacy_status IS NULL;

-- [4/11] Journey values become the STAGE; those leads are alive → 'ongoing'.
UPDATE leads SET stage = status, status = 'ongoing'
WHERE status IN ('new','contacted','assessment_scheduled','proposal_sent','pos_signed','waiting_start');

-- [5/11] on_hold and cold become STANDBY (flagged in standby_reason for
-- review — a 'cold' lead may really be lost; your team decides, not the
-- migration). No standby_until is invented: a fabricated date is worse
-- than a blank, and the UI will ask for one on the next touch.
UPDATE leads
SET standby_reason = 'Migrated from legacy status ' || status || ' — review: set a follow-up date, or mark Lost/Cancelled',
    status = 'standby'
WHERE status IN ('on_hold','cold');

-- [6/11] Archived rows: the archive becomes a timestamp; the trapped
-- status becomes 'cancelled' (their true pre-archive state was destroyed
-- by the old code and survives only in legacy_status).
UPDATE leads SET archived_at = updated_at, status = 'cancelled'
WHERE status = 'archived';

-- [7/11] Sanity: after 4–6, every status must be in the new vocabulary.
-- Expect ZERO rows. If any appear, STOP and paste them to Claude.
SELECT id, full_name, status, legacy_status FROM leads
WHERE status NOT IN ('ongoing','standby','won','lost','cancelled');

-- [8/11] Outcomes and pauses are no longer stages: deactivate their
-- lead_stages rows so they vanish from stage pickers and the board.
-- (Rows kept, not deleted — history and reactivation stay possible.)
UPDATE lead_stages SET is_active = false
WHERE key IN ('won','on_hold','cold','lost');

-- [9/11] Index the new working-view predicates.
CREATE INDEX IF NOT EXISTS leads_stage_idx ON leads(stage);

-- [10/11] Index archived_at for the working-view filter.
CREATE INDEX IF NOT EXISTS leads_archived_at_idx ON leads(archived_at);

-- [11/11] Reload the PostgREST schema cache.
NOTIFY pgrst, 'reload schema';

-- ── Verification (run after all 11; read-only) ──────────────
-- SELECT status, count(*) FROM leads GROUP BY status ORDER BY status;
-- SELECT stage, count(*) FROM leads WHERE status IN ('ongoing','standby') GROUP BY stage ORDER BY stage;
-- SELECT count(*) AS archived FROM leads WHERE archived_at IS NOT NULL;
