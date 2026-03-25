-- ============================================================
-- VITALIS PORTAL — DATABASE SCHEMA
-- Migration 001: Core tables for all four modules
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- AUTH & STAFF PROFILES
-- ============================================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'caregiver' CHECK (role IN ('admin','supervisor','caregiver')),
  hire_date     DATE,
  phone         TEXT,
  department    TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'caregiver')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- LMS — COURSES
-- ============================================================
CREATE TABLE courses (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               TEXT NOT NULL,
  description         TEXT,
  category            TEXT NOT NULL DEFAULT 'General',
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_by          UUID REFERENCES profiles(id),
  estimated_minutes   INTEGER DEFAULT 30,
  thumbnail_color     TEXT DEFAULT '#0E7C7B',
  pass_score          INTEGER DEFAULT 80,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE course_sections (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('text','pdf','video','quiz')),
  content      TEXT,
  video_url    TEXT,
  pdf_url      TEXT,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id      UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  question        TEXT NOT NULL,
  options         JSONB NOT NULL DEFAULT '[]',
  correct_index   INTEGER NOT NULL DEFAULT 0,
  order_index     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE course_enrollments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assigned_by   UUID REFERENCES profiles(id),
  assigned_at   TIMESTAMPTZ DEFAULT NOW(),
  due_date      DATE,
  completed_at  TIMESTAMPTZ,
  progress_pct  INTEGER DEFAULT 0,
  UNIQUE(user_id, course_id)
);

CREATE TABLE section_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id   UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  section_id      UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ DEFAULT NOW(),
  quiz_score      INTEGER,
  UNIQUE(enrollment_id, section_id)
);

-- ============================================================
-- POLICIES & PROCEDURES
-- ============================================================
CREATE TABLE policies (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  category         TEXT NOT NULL DEFAULT 'General',
  content          TEXT NOT NULL DEFAULT '',
  version          TEXT NOT NULL DEFAULT 'v1.0',
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  effective_date   DATE,
  created_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE policy_acknowledgements (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id        UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  version_signed   TEXT NOT NULL,
  signed_at        TIMESTAMPTZ DEFAULT NOW(),
  ip_address       INET,
  UNIQUE(policy_id, user_id, version_signed)
);

-- ============================================================
-- CREDENTIALS
-- ============================================================
CREATE TABLE credential_types (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL UNIQUE,
  validity_days         INTEGER NOT NULL DEFAULT 365,
  required_for_roles    JSONB DEFAULT '["caregiver","supervisor"]',
  reminder_days         JSONB DEFAULT '[30,14,7]',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staff_credentials (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_type_id    UUID NOT NULL REFERENCES credential_types(id),
  issue_date            DATE NOT NULL,
  expiry_date           DATE,
  document_url          TEXT,
  notes                 TEXT,
  status                TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current','expiring','expired','missing')),
  verified_by           UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-compute credential status
CREATE OR REPLACE FUNCTION update_credential_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
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

CREATE TRIGGER credential_status_trigger
  BEFORE INSERT OR UPDATE ON staff_credentials
  FOR EACH ROW EXECUTE FUNCTION update_credential_status();

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id),
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    UUID,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEWS
-- ============================================================

-- Compliance summary per staff member
CREATE VIEW staff_compliance_summary AS
SELECT
  p.id,
  p.full_name,
  p.role,
  p.status,
  COUNT(DISTINCT ce.id) FILTER (WHERE ce.completed_at IS NULL AND ce.due_date < CURRENT_DATE) AS overdue_training,
  COUNT(DISTINCT ce.id) FILTER (WHERE ce.completed_at IS NOT NULL) AS completed_training,
  COUNT(DISTINCT pa.id) AS policies_signed,
  COUNT(DISTINCT sc.id) FILTER (WHERE sc.status = 'expired') AS expired_credentials,
  COUNT(DISTINCT sc.id) FILTER (WHERE sc.status = 'expiring') AS expiring_credentials
FROM profiles p
LEFT JOIN course_enrollments ce ON ce.user_id = p.id
LEFT JOIN policy_acknowledgements pa ON pa.user_id = p.id
LEFT JOIN staff_credentials sc ON sc.user_id = p.id
WHERE p.status = 'active'
GROUP BY p.id, p.full_name, p.role, p.status;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone reads own, admins read all
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor'))
);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Courses: all authenticated users read published; admins/supervisors manage
CREATE POLICY "courses_read_published" ON courses FOR SELECT USING (status = 'published' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));
CREATE POLICY "courses_write_admin" ON courses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

CREATE POLICY "sections_read" ON course_sections FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND (c.status = 'published' OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')))));
CREATE POLICY "sections_write_admin" ON course_sections FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

CREATE POLICY "quiz_read" ON quiz_questions FOR SELECT USING (true);
CREATE POLICY "quiz_write_admin" ON quiz_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

CREATE POLICY "enrollments_own" ON course_enrollments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "enrollments_admin" ON course_enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

CREATE POLICY "progress_own" ON section_progress FOR ALL USING (
  EXISTS (SELECT 1 FROM course_enrollments WHERE id = enrollment_id AND user_id = auth.uid()));
CREATE POLICY "progress_admin" ON section_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

-- Policies: all read published; admins manage
CREATE POLICY "policy_read_published" ON policies FOR SELECT USING (status = 'published' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));
CREATE POLICY "policy_write_admin" ON policies FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

CREATE POLICY "acknowledgements_own" ON policy_acknowledgements FOR ALL USING (user_id = auth.uid());
CREATE POLICY "acknowledgements_admin" ON policy_acknowledgements FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

-- Credentials: own view; admins manage
CREATE POLICY "cred_types_read" ON credential_types FOR SELECT USING (true);
CREATE POLICY "cred_types_admin" ON credential_types FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));
CREATE POLICY "staff_creds_own" ON staff_credentials FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "staff_creds_admin" ON staff_credentials FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

-- Audit log: admins only
CREATE POLICY "audit_admin" ON audit_log FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

