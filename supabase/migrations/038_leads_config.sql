-- ============================================================
-- Migration 038: Leads Configuration Tables
-- Referral sources, configurable stages, configurable service types
-- ============================================================

-- ── Referral sources ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_sources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  name         TEXT NOT NULL,
  type         TEXT DEFAULT 'other',
  -- 'social_worker' | 'case_manager' | 'hospital' | 'doctor_office'
  -- | 'discharge_planner' | 'community_org' | 'insurance' | 'other'
  organization TEXT,
  phone        TEXT,
  email        TEXT,
  notes        TEXT,
  is_active    BOOLEAN DEFAULT true
);

-- Add referral_source_id to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_source_id UUID REFERENCES referral_sources(id) ON DELETE SET NULL;

-- ── Pipeline stages (replaces hardcoded STAGES array) ────────
CREATE TABLE IF NOT EXISTS lead_stages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  key         TEXT NOT NULL UNIQUE,
  label       TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#8FA0B0',
  bg_color    TEXT NOT NULL DEFAULT '#EFF2F5',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  is_system   BOOLEAN DEFAULT false  -- system stages cannot be deleted
);

-- Seed default stages (in order)
INSERT INTO lead_stages (key, label, color, bg_color, order_index, is_system) VALUES
  ('new',                  'New',                   '#8FA0B0', '#EFF2F5',  1,  true),
  ('contacted',            'Contacted',              '#457B9D', '#EBF4FF',  2,  true),
  ('assessment_scheduled', 'Assessment Scheduled',   '#7C3AED', '#EDE9FE',  3,  true),
  ('proposal_sent',        'Proposal Sent',          '#D97706', '#FEF3C7',  4,  true),
  ('pos_signed',           'POS Signed & Sent',      '#0891B2', '#E0F2FE',  5,  false),
  ('waiting_start',        'Waiting for Start Date', '#059669', '#D1FAE5',  6,  false),
  ('won',                  'Won ✓',                  '#0B6B5C', '#A7F3D0',  7,  true),
  ('on_hold',              'On Hold',                '#92400E', '#FDE68A',  8,  true),
  ('cold',                 'Cold',                   '#6B7280', '#F3F4F6',  9,  true),
  ('lost',                 'Lost',                   '#DC2626', '#FEE2E2', 10,  true)
ON CONFLICT (key) DO NOTHING;

-- Update the status check constraint on leads to allow new stages
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
-- No constraint now — stages are managed via lead_stages table

-- ── Lead service types (replaces hardcoded CARE_TYPES) ───────
CREATE TABLE IF NOT EXISTS lead_service_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  label       TEXT NOT NULL UNIQUE,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN DEFAULT true
);

INSERT INTO lead_service_types (label, order_index) VALUES
  ('Personal Care',      1),
  ('Companion Care',     2),
  ('Skilled Nursing',    3),
  ('Respite Care',       4),
  ('Overnight',          5),
  ('Live-In',            6),
  ('BCHD Personal Care', 7),
  ('BCHD Chore',         8),
  ('Medicaid Waiver',    9),
  ('Genworth',          10),
  ('Private Pay',       11),
  ('Other LTC',         12)
ON CONFLICT (label) DO NOTHING;

-- ── RLS for new tables ────────────────────────────────────────
ALTER TABLE referral_sources  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_stages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_service_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_referral_sources"  ON referral_sources  FOR ALL USING (true);
CREATE POLICY "service_all_lead_stages"        ON lead_stages        FOR ALL USING (true);
CREATE POLICY "service_all_lead_service_types" ON lead_service_types FOR ALL USING (true);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS referral_sources_active_idx ON referral_sources(is_active);
CREATE INDEX IF NOT EXISTS lead_stages_order_idx       ON lead_stages(order_index);
CREATE INDEX IF NOT EXISTS lead_service_types_order_idx ON lead_service_types(order_index);
CREATE INDEX IF NOT EXISTS leads_referral_source_idx   ON leads(referral_source_id);
