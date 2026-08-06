-- ============================================================
-- Migration 20260806: Leads next-action engine (v0.6.39)
-- Run in the VITA Supabase SQL Editor (ttojfvyfxqyzwvuzhvtd)
-- ONE STATEMENT AT A TIME.
--
-- The rule this migration serves: no open lead without a next
-- action. The action lives ON the lead; activity follow-ups
-- replace it; Standby wake-up dates play the role for paused
-- leads.
-- ============================================================

-- [1/6] Backup snapshot.
CREATE TABLE leads_backup_20260806 AS SELECT * FROM leads;

-- [2/6] The next-action columns (additive).
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS next_action_type TEXT,
  ADD COLUMN IF NOT EXISTS next_action_due  DATE,
  ADD COLUMN IF NOT EXISTS next_action_note TEXT;

-- [3/6] Backfill from the activity log: each open lead's EARLIEST
-- still-future follow-up becomes its next action. Ongoing leads
-- with no future follow-up stay NULL on purpose — they belong in
-- the No Next Action queue, not behind an invented date.
UPDATE leads l
SET next_action_type = 'follow_up',
    next_action_due  = a.fu
FROM (
  SELECT lead_id, MIN(next_follow_up) AS fu
  FROM lead_activities
  WHERE next_follow_up >= CURRENT_DATE
  GROUP BY lead_id
) a
WHERE a.lead_id = l.id
  AND l.next_action_due IS NULL
  AND l.status IN ('ongoing','standby');

-- [4/6] Index the digest and queue predicate.
CREATE INDEX IF NOT EXISTS leads_next_action_due_idx ON leads(next_action_due);

-- [5/6] Informational: how big is the No Next Action queue on day
-- one? (Read-only — paste the number to Claude.)
SELECT count(*) AS ongoing_without_next_action
FROM leads
WHERE status = 'ongoing' AND next_action_due IS NULL AND archived_at IS NULL;

-- [6/6] Reload the PostgREST schema cache.
NOTIFY pgrst, 'reload schema';
