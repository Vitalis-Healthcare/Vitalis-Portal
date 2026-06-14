-- 043_application_expansion.sql
-- v0.6.5 (Phase 2 expansion): richer caregiver application — identification,
-- work history, references (2 professional + 1 character), emergency contacts,
-- skills/training, structured availability, and additional questions.
--
-- All additive + nullable/defaulted. Idempotent (ADD COLUMN IF NOT EXISTS).
-- Repeatable groups are JSONB arrays; everything else is flat columns.
-- No new status values, no enum changes, no RPC -> no NOTIFY pgrst needed.
--
-- NOTE: ssn is sensitive PII. onb_applications has RLS OFF and is reached only
-- by server-side service-role code (candidate pages via token-validated server
-- code; staff via the admin-gated dashboard). It is never exposed to the anon
-- client. Treat accordingly.

ALTER TABLE onb_applications
  -- Identification
  ADD COLUMN IF NOT EXISTS gender                   TEXT,
  ADD COLUMN IF NOT EXISTS ssn                      TEXT,
  ADD COLUMN IF NOT EXISTS driver_license_received  BOOLEAN,
  ADD COLUMN IF NOT EXISTS driver_license_number    TEXT,
  ADD COLUMN IF NOT EXISTS driver_license_state     TEXT,
  ADD COLUMN IF NOT EXISTS home_phone               TEXT,

  -- Repeatable groups (JSONB arrays of objects)
  ADD COLUMN IF NOT EXISTS work_experience          JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS applicant_references     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS emergency_contacts       JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Skills & specialized training
  ADD COLUMN IF NOT EXISTS willing_to_work_with     TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience_with          TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_certifications TEXT,

  -- Availability
  ADD COLUMN IF NOT EXISTS available_all_hours      BOOLEAN,
  ADD COLUMN IF NOT EXISTS availability_days        JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS live_in_interested       BOOLEAN,
  ADD COLUMN IF NOT EXISTS live_in_max_days         INTEGER,

  -- Additional questions
  ADD COLUMN IF NOT EXISTS smoker                   BOOLEAN,
  ADD COLUMN IF NOT EXISTS smoker_per_day           TEXT,
  ADD COLUMN IF NOT EXISTS how_heard                TEXT,
  ADD COLUMN IF NOT EXISTS recent_experience        TEXT,
  ADD COLUMN IF NOT EXISTS why_caregiver            TEXT;

-- Shapes (for reference; enforced in application code, not by the DB):
--   work_experience:      [{ organization, contact_person, telephone, dates_worked, may_contact }]
--   applicant_references: [{ kind: 'professional'|'character', name, title, phone, dates_known }]
--   emergency_contacts:   [{ name, relationship, phone, phone_type }]
--   availability_days:    { mon, tue, wed, thu, fri, sat, sun }  (free-text per day)
