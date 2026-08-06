-- ============================================================
-- Vita v0.6.61 — "Fingerprinting form sent — results pending"
-- Run in the Supabase SQL Editor (project ttojfvyfxqyzwvuzhvtd),
-- one statement at a time, in this order.
-- ============================================================

-- ── 1. The attestation ──────────────────────────────────────────────────────
-- CJIS results follow a physical trip to a fingerprinting site and take days to
-- come back. This records a coordinator's accountable statement that the
-- process has been STARTED, which stands in for the document while we wait.
--
-- It is a TABLE, not a pair of columns, because the history is the point:
-- every extension must leave a trace with a reason attached, so nobody can
-- quietly push the date out until the requirement evaporates.
CREATE TABLE IF NOT EXISTS onb_fingerprint_attestations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id     UUID NOT NULL REFERENCES onb_candidates(id) ON DELETE CASCADE,

  -- The day the fingerprinting form was sent to the candidate.
  sent_at          DATE NOT NULL,
  -- When results are expected. Defaults to sent_at + 14 days in the UI, but is
  -- stored explicitly so a changed window is visible rather than inferred.
  expected_by      DATE NOT NULL,
  -- Free text: which site, receipt or tracking number, who spoke to whom.
  note             TEXT,

  -- Set only on a row that extends an earlier one. Required by the API in that
  -- case: an extension without a stated reason is exactly the silent slippage
  -- this table exists to prevent.
  extension_reason TEXT,
  supersedes_id    UUID REFERENCES onb_fingerprint_attestations(id) ON DELETE SET NULL,

  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Closed automatically when the CJIS document is uploaded.
  cleared_at       TIMESTAMPTZ,
  cleared_by       UUID REFERENCES auth.users(id),
  -- Set when a later attestation replaces this one.
  superseded_at    TIMESTAMPTZ
);

-- ── 2. History lookup ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS onb_fingerprint_attestations_candidate_idx
  ON onb_fingerprint_attestations (candidate_id, created_at DESC);

-- ── 3. Exactly one live attestation per candidate ───────────────────────────
-- "Live" means neither cleared by the arriving document nor superseded by a
-- later extension. Enforced by the database so two coordinators recording at
-- the same moment cannot produce two open clocks for one person.
CREATE UNIQUE INDEX IF NOT EXISTS onb_fingerprint_attestations_one_live
  ON onb_fingerprint_attestations (candidate_id)
  WHERE cleared_at IS NULL AND superseded_at IS NULL;

-- ── 4. The overdue sweep reads this ─────────────────────────────────────────
-- Supports the escalation ladder in the next release without a full scan.
CREATE INDEX IF NOT EXISTS onb_fingerprint_attestations_due_idx
  ON onb_fingerprint_attestations (expected_by)
  WHERE cleared_at IS NULL AND superseded_at IS NULL;

-- ── 5. Service-role only, same as every other onb_ table ────────────────────
ALTER TABLE onb_fingerprint_attestations ENABLE ROW LEVEL SECURITY;

-- ── 6. PostgREST schema cache ───────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
