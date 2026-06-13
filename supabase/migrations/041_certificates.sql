-- ============================================================
-- Migration 041: Candidate Onboarding — Certificates (v0.6.2)
-- Run in Supabase SQL Editor (one block; idempotent)
-- Creates: onb_settings (+counter seed), onb_certificates,
--          onb_next_certificate_number()
-- ============================================================

-- ── Settings (key/value) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS onb_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Certificate counter. The NEXT certificate issued = this value + 1.
-- Seeded at 32 (sample showed 0000000032, so the next is 0000000033).
-- >>> If your real last-issued number is different, change '32' below,
--     OR after running, run:  UPDATE onb_settings
--       SET value = '<your last number>' WHERE key = 'last_certificate_number';
INSERT INTO onb_settings (key, value)
VALUES ('last_certificate_number', '32')
ON CONFLICT (key) DO NOTHING;

-- ── Certificates (one per candidate) ────────────────────────
CREATE TABLE IF NOT EXISTS onb_certificates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  candidate_id        UUID NOT NULL REFERENCES onb_candidates(id) ON DELETE CASCADE,
  certificate_number  INTEGER NOT NULL UNIQUE,
  issued_to_name      TEXT NOT NULL,
  score               INTEGER,
  total               INTEGER,
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS onb_certificates_candidate_idx ON onb_certificates (candidate_id);

-- ── Atomic next-number allocator ────────────────────────────
-- Increments the counter and returns the new value in a single locked
-- statement, so concurrent completions never collide on a number.
CREATE OR REPLACE FUNCTION onb_next_certificate_number()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE n INTEGER;
BEGIN
  UPDATE onb_settings
     SET value = (value::int + 1)::text
   WHERE key = 'last_certificate_number'
  RETURNING value::int INTO n;
  RETURN n;
END;
$$;

-- ── Verify ──────────────────────────────────────────────────
-- SELECT value FROM onb_settings WHERE key = 'last_certificate_number';  -- your last number
-- SELECT onb_next_certificate_number();  -- DO NOT run casually: it consumes a number
