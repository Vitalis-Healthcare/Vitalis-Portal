-- ============================================================
-- Vita v0.6.60 — Application reminders + setting a candidate aside
-- Run in the Supabase SQL Editor (project ttojfvyfxqyzwvuzhvtd),
-- one statement at a time, in this order.
-- ============================================================

-- ── 1. Why a candidate stopped, and the opt-out link ────────────────────────
-- withdrawn_at/withdrawal_reason record WHY a candidate left, which the
-- 'withdrawn' status alone has never been able to say. optout_token is
-- deliberately SEPARATE from access_token: changing a candidate's email
-- revokes access_token (v0.6.37), and the "no longer interested" link must
-- neither be revoked by that nor grant any access to the application itself.
ALTER TABLE onb_candidates
  ADD COLUMN IF NOT EXISTS withdrawn_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT,
  ADD COLUMN IF NOT EXISTS withdrawn_by      UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS optout_token      TEXT,
  ADD COLUMN IF NOT EXISTS optout_expires_at TIMESTAMPTZ;

-- ── 2. Lookup index for the public opt-out page ─────────────────────────────
CREATE INDEX IF NOT EXISTS onb_candidates_optout_token_idx
  ON onb_candidates (optout_token);

-- ── 3. The reminder log ─────────────────────────────────────────────────────
-- One row per reminder actually sent. This is what makes the cadence
-- idempotent and what lets a coordinator see how hard we have already chased
-- someone before chasing them again.
CREATE TABLE IF NOT EXISTS onb_application_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    UUID NOT NULL REFERENCES onb_candidates(id) ON DELETE CASCADE,
  reminder_number INTEGER NOT NULL,
  kind            TEXT NOT NULL DEFAULT 'auto',
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_by         UUID REFERENCES auth.users(id),
  resend_id       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. History index ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS onb_application_reminders_candidate_idx
  ON onb_application_reminders (candidate_id, sent_at DESC);

-- ── 5. The idempotency guarantee ────────────────────────────────────────────
-- A scheduled reminder can be sent at most ONCE per candidate per number. The
-- database enforces it rather than the cron checking first and racing itself
-- on a retry or an overlapping run. Manual nudges are exempt: a coordinator
-- may send as many as the situation warrants.
CREATE UNIQUE INDEX IF NOT EXISTS onb_application_reminders_auto_once
  ON onb_application_reminders (candidate_id, reminder_number)
  WHERE kind = 'auto';

-- ── 6. Service-role only, same as every other onb_ table ────────────────────
ALTER TABLE onb_application_reminders ENABLE ROW LEVEL SECURITY;

-- ── 7. PostgREST schema cache ───────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
