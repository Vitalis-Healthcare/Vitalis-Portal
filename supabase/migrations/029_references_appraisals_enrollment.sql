-- Migration 029 — References, Appraisals, Enrollment Requests, N/A Credentials
-- Covers all new features in v2.9.8 through v2.9.12.
-- Run once. All blocks are idempotent.

-- ============================================================
-- 1. CREDENTIAL N/A FLAG
-- ============================================================

ALTER TABLE staff_credentials
  ADD COLUMN IF NOT EXISTS not_applicable BOOLEAN NOT NULL DEFAULT false;

-- Update trigger to respect not_applicable
CREATE OR REPLACE FUNCTION update_credential_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.not_applicable = true THEN
    NEW.status := 'current';
  ELSIF NEW.does_not_expire = true THEN
    NEW.status := 'current';
  ELSIF NEW.expiry_date IS NOT NULL THEN
    IF NEW.expiry_date < CURRENT_DATE THEN
      NEW.status := 'expired';
    ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
      NEW.status := 'expiring';
    ELSE
      NEW.status := 'current';
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. ENROLLMENT REQUESTS
-- Caregiver requests a course/programme; admin/supervisor approves
-- ============================================================

CREATE TABLE IF NOT EXISTS enrollment_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id           UUID REFERENCES courses(id) ON DELETE CASCADE,
  programme_id        UUID REFERENCES programmes(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected')),
  request_message     TEXT,
  review_notes        TEXT,
  reviewed_by         UUID REFERENCES profiles(id),
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT enroll_req_course_or_programme CHECK (
    (course_id IS NOT NULL) OR (programme_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_enroll_req_user     ON enrollment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_enroll_req_status   ON enrollment_requests(status);

ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enroll_req_own_select" ON enrollment_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "enroll_req_own_insert" ON enrollment_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "enroll_req_admin_all" ON enrollment_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role IN ('admin','supervisor','staff'))
  );

-- ============================================================
-- 3. CAREGIVER REFERENCES
-- 2 professional + 1 character per caregiver
-- ============================================================

CREATE TABLE IF NOT EXISTS caregiver_references (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reference_type    TEXT NOT NULL CHECK (reference_type IN ('professional','character')),
  slot              INTEGER NOT NULL CHECK (slot IN (1,2,3)),
                    -- professional: slot 1 & 2, character: slot 3
  referee_name      TEXT,
  referee_email     TEXT NOT NULL,
  referee_phone     TEXT,
  referee_org       TEXT,
  token             TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','sent','received','expired')),
  sent_at           TIMESTAMPTZ,
  received_at       TIMESTAMPTZ,
  reminder_count    INTEGER NOT NULL DEFAULT 0,
  last_reminder_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (caregiver_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_cg_refs_caregiver ON caregiver_references(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_cg_refs_token     ON caregiver_references(token);
CREATE INDEX IF NOT EXISTS idx_cg_refs_status    ON caregiver_references(status);

ALTER TABLE caregiver_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cg_refs_own_select" ON caregiver_references
  FOR SELECT USING (caregiver_id = auth.uid());

CREATE POLICY "cg_refs_own_insert" ON caregiver_references
  FOR INSERT WITH CHECK (caregiver_id = auth.uid());

CREATE POLICY "cg_refs_own_update" ON caregiver_references
  FOR UPDATE USING (caregiver_id = auth.uid());

CREATE POLICY "cg_refs_admin_all" ON caregiver_references
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role IN ('admin','supervisor','staff'))
  );

-- ============================================================
-- 4. REFERENCE SUBMISSIONS
-- Data submitted by the referee via public token link (no login)
-- ============================================================

CREATE TABLE IF NOT EXISTS reference_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id      UUID NOT NULL REFERENCES caregiver_references(id) ON DELETE CASCADE,

  -- Common fields
  referee_name      TEXT,
  referee_title     TEXT,
  referee_date      DATE,
  comments          TEXT,

  -- Professional reference fields
  employer_name     TEXT,
  employer_address  TEXT,
  supervisor_name   TEXT,
  supervisor_phone  TEXT,
  supervisor_email  TEXT,
  position_held     TEXT,
  area_worked       TEXT,
  employment_from   DATE,
  employment_to     DATE,
  resigned_or_terminated TEXT,
  eligible_for_rehire    TEXT CHECK (eligible_for_rehire IN ('yes','no') OR eligible_for_rehire IS NULL),
  reason_for_leaving     TEXT,
  travel_assignment      BOOLEAN,
  -- Ratings: 'very_good' | 'satisfactory' | 'fair' | 'poor'
  rating_quality         TEXT,
  rating_flexibility     TEXT,
  rating_attitude        TEXT,
  rating_stability       TEXT,
  rating_pressure        TEXT,
  rating_dependability   TEXT,
  rating_cooperation     TEXT,

  -- Character reference fields
  related_to_applicant   BOOLEAN,
  relation_explanation   TEXT,
  years_known            INTEGER,
  context_known          TEXT,
  -- Each: 'yes' | 'no' | 'dont_know'
  questioned_honesty       TEXT,
  questioned_trustworthy   TEXT,
  questioned_diligence     TEXT,
  questioned_reliability   TEXT,
  questioned_character     TEXT,
  questioned_maturity      TEXT,
  -- 'highly_recommended' | 'recommended' | 'reservations' | 'not_recommended'
  overall_recommendation   TEXT,

  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address        TEXT
);

ALTER TABLE reference_submissions ENABLE ROW LEVEL SECURITY;

-- Public insert via token (no auth) — handled by service role in API route
CREATE POLICY "ref_submit_admin_read" ON reference_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role IN ('admin','supervisor','staff'))
  );

-- ============================================================
-- 5. REFERENCE REMINDER LOG
-- Dedup for 15/30/45 day automated reminders
-- ============================================================

CREATE TABLE IF NOT EXISTS reference_reminder_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id    UUID NOT NULL REFERENCES caregiver_references(id) ON DELETE CASCADE,
  reminder_day    INTEGER NOT NULL CHECK (reminder_day IN (15, 30, 45)),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reference_id, reminder_day)
);

ALTER TABLE reference_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_reminder_admin" ON reference_reminder_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role IN ('admin','supervisor'))
  );

-- ============================================================
-- 6. APPRAISALS
-- Admin fills HHA evaluation; caregiver signs off via public token
-- ============================================================

CREATE TABLE IF NOT EXISTS appraisals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appraiser_id        UUID NOT NULL REFERENCES profiles(id),
  appraisal_period    TEXT,           -- e.g. "2025 Annual"
  sign_off_token      TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','sent','signed')),

  -- HHA Evaluation scores (1-4 per item)
  -- Clinical duties
  s_patient_care_duties         INTEGER CHECK (s_patient_care_duties BETWEEN 1 AND 4),
  s_medications                 INTEGER CHECK (s_medications BETWEEN 1 AND 4),
  s_care_conferences            INTEGER CHECK (s_care_conferences BETWEEN 1 AND 4),
  s_personal_care               INTEGER CHECK (s_personal_care BETWEEN 1 AND 4),
  s_shampoo                     INTEGER CHECK (s_shampoo BETWEEN 1 AND 4),
  s_bed_linen                   INTEGER CHECK (s_bed_linen BETWEEN 1 AND 4),
  s_vitals                      INTEGER CHECK (s_vitals BETWEEN 1 AND 4),
  s_reports_changes             INTEGER CHECK (s_reports_changes BETWEEN 1 AND 4),
  s_height_weight               INTEGER CHECK (s_height_weight BETWEEN 1 AND 4),
  s_bedpan                      INTEGER CHECK (s_bedpan BETWEEN 1 AND 4),
  s_enemas                      INTEGER CHECK (s_enemas BETWEEN 1 AND 4),
  s_specimens                   INTEGER CHECK (s_specimens BETWEEN 1 AND 4),
  s_room_order                  INTEGER CHECK (s_room_order BETWEEN 1 AND 4),
  s_household_services          INTEGER CHECK (s_household_services BETWEEN 1 AND 4),
  s_safety_devices              INTEGER CHECK (s_safety_devices BETWEEN 1 AND 4),
  s_body_mechanics              INTEGER CHECK (s_body_mechanics BETWEEN 1 AND 4),
  s_therapy_extension           INTEGER CHECK (s_therapy_extension BETWEEN 1 AND 4),
  s_equipment_cleaning          INTEGER CHECK (s_equipment_cleaning BETWEEN 1 AND 4),
  s_documentation               INTEGER CHECK (s_documentation BETWEEN 1 AND 4),
  s_asks_for_help               INTEGER CHECK (s_asks_for_help BETWEEN 1 AND 4),
  s_own_actions                 INTEGER CHECK (s_own_actions BETWEEN 1 AND 4),
  s_completes_work              INTEGER CHECK (s_completes_work BETWEEN 1 AND 4),
  s_no_unqualified_assignments  INTEGER CHECK (s_no_unqualified_assignments BETWEEN 1 AND 4),
  s_confidentiality             INTEGER CHECK (s_confidentiality BETWEEN 1 AND 4),
  s_meetings                    INTEGER CHECK (s_meetings BETWEEN 1 AND 4),
  s_chart_documentation         INTEGER CHECK (s_chart_documentation BETWEEN 1 AND 4),
  -- Professional conduct
  s_variance_reporting          INTEGER CHECK (s_variance_reporting BETWEEN 1 AND 4),
  s_qapi                        INTEGER CHECK (s_qapi BETWEEN 1 AND 4),
  s_policies_adherence          INTEGER CHECK (s_policies_adherence BETWEEN 1 AND 4),
  s_agency_standards            INTEGER CHECK (s_agency_standards BETWEEN 1 AND 4),
  s_attendance                  INTEGER CHECK (s_attendance BETWEEN 1 AND 4),
  s_tardiness                   INTEGER CHECK (s_tardiness BETWEEN 1 AND 4),
  s_reports_incomplete          INTEGER CHECK (s_reports_incomplete BETWEEN 1 AND 4),
  s_appearance                  INTEGER CHECK (s_appearance BETWEEN 1 AND 4),
  s_time_management             INTEGER CHECK (s_time_management BETWEEN 1 AND 4),
  s_inservices                  INTEGER CHECK (s_inservices BETWEEN 1 AND 4),
  s_clean_environment           INTEGER CHECK (s_clean_environment BETWEEN 1 AND 4),
  s_judgment                    INTEGER CHECK (s_judgment BETWEEN 1 AND 4),
  s_cpr_certification           INTEGER CHECK (s_cpr_certification BETWEEN 1 AND 4),
  s_other_duties                INTEGER CHECK (s_other_duties BETWEEN 1 AND 4),

  comments            TEXT,
  sent_at             TIMESTAMPTZ,
  signed_at           TIMESTAMPTZ,
  caregiver_signature TEXT,        -- typed name as signature
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appraisals_caregiver ON appraisals(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_appraisals_token     ON appraisals(sign_off_token);

ALTER TABLE appraisals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appraisals_own_select" ON appraisals
  FOR SELECT USING (caregiver_id = auth.uid());

CREATE POLICY "appraisals_admin_all" ON appraisals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role IN ('admin','supervisor'))
  );
