-- ============================================================
-- Vita v0.6.65 — drawn signatures on caregiver agreements
-- Run in the Supabase SQL Editor (project ttojfvyfxqyzwvuzhvtd),
-- one statement at a time, in this order.
-- ============================================================

-- ── 1. The drawn signature ──────────────────────────────────────────────────
-- A PNG data URL, stored on the contract row. Roughly 8–30 KB of base64 for a
-- typical signature, which is comfortably inside Postgres TEXT.
--
-- The image is ALSO embedded inline in rendered_html at the moment of signing.
-- That duplication is deliberate: rendered_html is the legal record, and it has
-- to prove itself without depending on this column, another table, or a storage
-- bucket still existing in three years.
--
-- signature_method records HOW the person signed, because a drawn signature is
-- allowed to be absent. Somebody with a tremor, or on a desktop with only a
-- mouse, must be able to complete onboarding — so the drawing is offered, not
-- demanded, and the document says which happened rather than leaving a reader
-- to guess from a missing image.
ALTER TABLE onb_contracts
  ADD COLUMN IF NOT EXISTS signature_image  TEXT,
  ADD COLUMN IF NOT EXISTS signature_method TEXT;

-- ── 2. PostgREST schema cache ───────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
