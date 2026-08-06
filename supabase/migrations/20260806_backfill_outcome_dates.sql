-- ═══════════════════════════════════════════════════════════════════════════
-- v0.6.54 (data correction, 6 August 2026) — backfill won_date / lost_date
-- from the timeline.
--
-- VITA project (ttojfvyfxqyzwvuzhvtd). RUN AND COMPLETED 6 August 2026.
-- This file is the record of what was executed, committed after the fact so
-- the migration history matches the database.
--
-- WHY
-- The 5 August stage/status split set status directly in SQL for the leads
-- that were already closed. won_date and lost_date are written only by
-- app/api/leads/update, on a status TRANSITION — so twenty closures carried
-- a status but no date. v0.6.52 papered over this with an updated_at
-- fallback, which dated all twenty to the migration itself and made every
-- reporting window return identical outcomes; v0.6.53 removed the fallback
-- and surfaced the gap honestly. This migration closes the gap properly.
--
-- WHERE THE DATES CAME FROM
-- Every status change through the buttons writes a lead_activities row:
--   activity_type = 'status_change'
--   content       = 'Status changed: <From> → <To>'  (Won's label is 'Won ✓',
--                   Lost may carry a reason detail in parentheses)
-- The transition timestamp IS the outcome date. It is read in
-- America/New_York so the stored date matches what the timeline displays.
--
-- THREE RULES BUILT IN
--   1. LATEST transition to the CURRENT status wins. One lead went
--      Contacted → Won in May, was reopened, then Proposal Sent → Won in
--      July. July is the truth; a first-match query would have written May.
--   2. Existing dates are never overwritten — only NULLs are filled, so
--      anything the convert_lead_to_client RPC stamped is untouched.
--   3. updated_at is deliberately NOT touched. After v0.6.53 nothing derives
--      an outcome date from it, and adding churn to a column that already
--      misled us once would be a poor trade.
--
-- lost_reason_code is deliberately NOT backfilled. Eleven losses carry no
-- reason; that is a judgment for the person who lost them, not something SQL
-- can recover. It remains an open owner task.
--
-- RESULT (verified): won 9/9 dated, lost 11/11 dated, 0 still undated.
-- ═══════════════════════════════════════════════════════════════════════════

-- Statement 1 of 6 — backup before touching anything
CREATE TABLE leads_backup_20260806_outcome_dates AS
SELECT id, full_name, status, won_date, lost_date, updated_at, now() AS backed_up_at
FROM leads;

-- Statement 2 of 6
ALTER TABLE leads_backup_20260806_outcome_dates ENABLE ROW LEVEL SECURITY;

-- Statement 3 of 6 — PREVIEW, read-only. Returned 20 rows before the writes.
WITH changes AS (
  SELECT a.lead_id,
         CASE WHEN split_part(a.content, ' → ', 2) LIKE 'Won%' THEN 'won' ELSE 'lost' END AS target,
         a.created_at
  FROM lead_activities a
  WHERE a.activity_type = 'status_change'
    AND a.content LIKE 'Status changed:%'
    AND (split_part(a.content, ' → ', 2) LIKE 'Won%'
      OR split_part(a.content, ' → ', 2) LIKE 'Lost%')
),
marks AS (
  SELECT DISTINCT ON (lead_id, target)
         lead_id, target,
         (created_at AT TIME ZONE 'America/New_York')::date AS marked_on
  FROM changes
  ORDER BY lead_id, target, created_at DESC
)
SELECT l.full_name, l.status, l.won_date, l.lost_date, m.marked_on AS will_be_set_to
FROM leads l
JOIN marks m ON m.lead_id = l.id AND m.target = l.status
WHERE (l.status = 'won'  AND l.won_date  IS NULL)
   OR (l.status = 'lost' AND l.lost_date IS NULL)
ORDER BY m.marked_on;

-- Statement 4 of 6 — won dates
WITH changes AS (
  SELECT a.lead_id,
         CASE WHEN split_part(a.content, ' → ', 2) LIKE 'Won%' THEN 'won' ELSE 'lost' END AS target,
         a.created_at
  FROM lead_activities a
  WHERE a.activity_type = 'status_change'
    AND a.content LIKE 'Status changed:%'
    AND (split_part(a.content, ' → ', 2) LIKE 'Won%'
      OR split_part(a.content, ' → ', 2) LIKE 'Lost%')
),
marks AS (
  SELECT DISTINCT ON (lead_id, target)
         lead_id, target,
         (created_at AT TIME ZONE 'America/New_York')::date AS marked_on
  FROM changes
  ORDER BY lead_id, target, created_at DESC
)
UPDATE leads l
SET won_date = m.marked_on
FROM marks m
WHERE m.lead_id = l.id
  AND m.target = 'won'
  AND l.status = 'won'
  AND l.won_date IS NULL;

-- Statement 5 of 6 — lost dates
WITH changes AS (
  SELECT a.lead_id,
         CASE WHEN split_part(a.content, ' → ', 2) LIKE 'Won%' THEN 'won' ELSE 'lost' END AS target,
         a.created_at
  FROM lead_activities a
  WHERE a.activity_type = 'status_change'
    AND a.content LIKE 'Status changed:%'
    AND (split_part(a.content, ' → ', 2) LIKE 'Won%'
      OR split_part(a.content, ' → ', 2) LIKE 'Lost%')
),
marks AS (
  SELECT DISTINCT ON (lead_id, target)
         lead_id, target,
         (created_at AT TIME ZONE 'America/New_York')::date AS marked_on
  FROM changes
  ORDER BY lead_id, target, created_at DESC
)
UPDATE leads l
SET lost_date = m.marked_on
FROM marks m
WHERE m.lead_id = l.id
  AND m.target = 'lost'
  AND l.status = 'lost'
  AND l.lost_date IS NULL;

-- Statement 6 of 6 — verify. Confirmed: won 9/9/0, lost 11/11/0.
SELECT status,
       count(*) AS total,
       count(*) FILTER (WHERE (status = 'won'  AND won_date  IS NOT NULL)
                           OR (status = 'lost' AND lost_date IS NOT NULL)) AS now_dated,
       count(*) FILTER (WHERE (status = 'won'  AND won_date  IS NULL)
                           OR (status = 'lost' AND lost_date IS NULL))     AS still_undated
FROM leads
WHERE status IN ('won', 'lost')
GROUP BY status
ORDER BY status;

-- ── Note for whoever reads this next ─────────────────────────────────────
-- The backup table leads_backup_20260806_outcome_dates holds the pre-backfill
-- values. Drop it only on Okezie's say-so.
--
-- Two data issues the preview surfaced, left for a human:
--   • "Long Candice" and "Long, Candice" are both won on 2026-07-17 and look
--     like one client entered twice — they will double-count in win rate and
--     in weekly revenue won until one is retired.
--   • One won lead has full_name 'N/A'.
