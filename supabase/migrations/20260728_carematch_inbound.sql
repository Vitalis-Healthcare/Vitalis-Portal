-- ============================================================
-- v0.6.25 — CareMatch360 → Vita inbound receiver
-- Run in the Supabase SQL Editor, ONE STATEMENT AT A TIME.
-- Idempotent: safe to re-run.
-- ============================================================

-- 1. Where this candidate came from. NULL for candidates a coordinator
--    keyed in by hand, 'carematch360' for pushed providers.
ALTER TABLE onb_candidates ADD COLUMN IF NOT EXISTS source TEXT;

-- 2. The CareMatch360 providers.id this candidate was created from.
--    This is the authoritative idempotency key for the receiver: pressing
--    "Send to Vita" twice must update one candidate, never create a second.
ALTER TABLE onb_candidates ADD COLUMN IF NOT EXISTS carematch_provider_id UUID;

-- 3. Partial unique index — one candidate per provider, while leaving the
--    many hand-entered candidates (all NULL here) unconstrained.
CREATE UNIQUE INDEX IF NOT EXISTS onb_candidates_carematch_provider_idx
  ON onb_candidates (carematch_provider_id)
  WHERE carematch_provider_id IS NOT NULL;

-- 4. PostgREST caches the schema. Without this the new columns are invisible
--    to the service client and the receiver fails on a column that plainly
--    exists in the table editor.
NOTIFY pgrst, 'reload schema';
