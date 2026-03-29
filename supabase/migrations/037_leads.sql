-- ============================================================
-- Migration 037: Leads Management Module
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Leads table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),

  -- Contact (person who called / enquired — may differ from care recipient)
  full_name             TEXT NOT NULL,
  relationship          TEXT DEFAULT 'family_member',
  -- 'self' | 'family_member' | 'social_worker' | 'hospital_discharge' | 'other'

  client_name           TEXT,          -- actual care recipient if different from enquirer
  email                 TEXT,
  phone                 TEXT,
  address               TEXT,
  city                  TEXT,
  state                 TEXT DEFAULT 'MD',

  -- Source
  source                TEXT NOT NULL DEFAULT 'phone',
  -- 'phone' | 'email' | 'website' | 'referral' | 'hospital' | 'doctor_office'
  -- | 'word_of_mouth' | 'social_media' | 'other'
  referral_name         TEXT,          -- name of referrer if source = 'referral'

  -- Pipeline stage
  status                TEXT NOT NULL DEFAULT 'new',
  -- 'new' | 'contacted' | 'assessment_scheduled' | 'proposal_sent'
  -- | 'won' | 'on_hold' | 'cold' | 'lost'

  assigned_to           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by            UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Care requirements
  care_types            TEXT[],
  -- 'personal_care' | 'companion' | 'skilled_nursing' | 'respite' | 'overnight' | 'live_in'
  condition_notes       TEXT,          -- brief clinical/situation notes
  preferred_schedule    TEXT,          -- e.g. "Mon–Fri 8am–2pm"

  -- Financials
  estimated_hours_week  NUMERIC(6,1),  -- estimated hours per week
  hourly_rate           NUMERIC(8,2),  -- quoted hourly rate
  expected_start_date   DATE,
  expected_close_date   DATE,

  -- Outcome
  won_date              DATE,
  lost_date             DATE,
  lost_reason           TEXT,

  -- General notes
  notes                 TEXT,

  CONSTRAINT leads_status_check CHECK (
    status IN ('new','contacted','assessment_scheduled','proposal_sent','won','on_hold','cold','lost')
  )
);

-- ── Lead activities (conversation / follow-up log) ──────────
CREATE TABLE IF NOT EXISTS lead_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,

  activity_type   TEXT NOT NULL DEFAULT 'note',
  -- 'note' | 'call' | 'email' | 'meeting' | 'assessment' | 'follow_up' | 'status_change'

  content         TEXT NOT NULL,
  outcome         TEXT,
  -- 'positive' | 'neutral' | 'negative' | 'no_answer' | 'left_voicemail'
  next_follow_up  DATE
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS leads_status_idx       ON leads(status);
CREATE INDEX IF NOT EXISTS leads_created_at_idx   ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx  ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS lead_activities_lead_idx ON lead_activities(lead_id, created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (used by all our API routes)
CREATE POLICY "service_all_leads"      ON leads           FOR ALL USING (true);
CREATE POLICY "service_all_activities" ON lead_activities FOR ALL USING (true);

-- ── Updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_leads_updated_at();

RAISE NOTICE 'Migration 037 complete — leads + lead_activities tables created';
