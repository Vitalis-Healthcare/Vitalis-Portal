-- 042_application_documents.sql
-- Phase 2 (v0.6.3): candidate application form + document uploads.
-- Two tables (raw CREATE TABLE -> RLS stays OFF, matching the onb_* convention:
-- service-role server code reads/writes; candidate pages reach them only through
-- token-validated server code) + a PRIVATE Storage bucket for uploaded documents.
--
-- No enum / ALTER TYPE: onb_candidates.status is plain TEXT (no CHECK), so the
-- new statuses 'applying' | 'application_submitted' | 'in_review' write freely.
-- No RPC added here, so no NOTIFY pgrst needed.
--
-- Idempotent: IF NOT EXISTS throughout; bucket insert uses ON CONFLICT DO NOTHING.

-- ── Application (one row per candidate) ──────────────────────────────
CREATE TABLE IF NOT EXISTS onb_applications (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id            UUID NOT NULL UNIQUE REFERENCES onb_candidates(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Personal
  legal_first_name        TEXT,
  middle_name             TEXT,
  legal_last_name         TEXT,
  preferred_name          TEXT,
  date_of_birth           DATE,
  phone                   TEXT,
  email                   TEXT,
  address_street          TEXT,
  address_unit            TEXT,
  address_city            TEXT,
  address_state           TEXT,
  address_zip             TEXT,

  -- Work eligibility
  work_authorized         BOOLEAN,
  requires_sponsorship    BOOLEAN,
  is_18_or_older          BOOLEAN,
  has_transportation      BOOLEAN,

  -- Professional
  credential_type         TEXT,
  license_number          TEXT,
  years_experience        TEXT,
  languages               TEXT,

  -- Availability
  availability            TEXT,
  earliest_start_date     DATE,

  -- Emergency contact
  emergency_name          TEXT,
  emergency_relationship  TEXT,
  emergency_phone         TEXT,

  -- References
  reference1_name         TEXT,
  reference1_relationship TEXT,
  reference1_contact      TEXT,
  reference2_name         TEXT,
  reference2_relationship TEXT,
  reference2_contact      TEXT,

  -- Attestation
  attested                BOOLEAN NOT NULL DEFAULT false,
  signature_name          TEXT,
  signed_at               TIMESTAMPTZ,

  -- Workflow
  submitted_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS onb_applications_candidate_idx
  ON onb_applications (candidate_id);

-- ── Documents (many rows per candidate) ──────────────────────────────
CREATE TABLE IF NOT EXISTS onb_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  UUID NOT NULL REFERENCES onb_candidates(id) ON DELETE CASCADE,
  doc_type      TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  mime_type     TEXT,
  size_bytes    BIGINT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onb_documents_candidate_idx
  ON onb_documents (candidate_id, uploaded_at DESC);

-- ── Private Storage bucket for uploaded documents ────────────────────
-- Private (PII). Access is service-role only from server code; staff view files
-- via short-lived signed URLs (v0.6.3-b). No Storage RLS policies are added,
-- consistent with the RLS-off pattern on the onb_* tables.
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding-documents', 'onboarding-documents', false)
ON CONFLICT (id) DO NOTHING;
