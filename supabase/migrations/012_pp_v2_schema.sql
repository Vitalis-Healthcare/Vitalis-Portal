-- Migration 012 — P&P Module v2: Version control, AI conversations, edit proposals

-- Full version history for every policy document
CREATE TABLE IF NOT EXISTS pp_policy_versions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id          VARCHAR(20)   NOT NULL REFERENCES pp_policies(doc_id),
  version         VARCHAR(10)   NOT NULL,
  html_content    TEXT          NOT NULL,
  change_summary  TEXT,                        -- "What changed in this version"
  change_type     VARCHAR(20)   DEFAULT 'minor'
                  CHECK (change_type IN ('initial','minor','major','regulatory','personnel')),
  changed_by      UUID          REFERENCES auth.users(id),
  changed_by_role VARCHAR(60),
  regulatory_ref  TEXT,                        -- e.g. "COMAR 10.07.05.08 updated March 2025"
  approved_by     UUID          REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE (doc_id, version)
);

CREATE INDEX IF NOT EXISTS idx_pp_versions_doc  ON pp_policy_versions (doc_id);
CREATE INDEX IF NOT EXISTS idx_pp_versions_date ON pp_policy_versions (created_at);

-- AI-assisted edit proposals (draft edits awaiting admin approval)
CREATE TABLE IF NOT EXISTS pp_edit_proposals (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id            VARCHAR(20)   NOT NULL REFERENCES pp_policies(doc_id),
  section_id        TEXT,                        -- HTML section id e.g. "purpose", "policy"
  section_title     TEXT,
  original_text     TEXT          NOT NULL,
  proposed_text     TEXT          NOT NULL,
  change_reason     TEXT,
  ai_prompt         TEXT,                        -- the prompt that generated this
  proposed_by       UUID          REFERENCES auth.users(id),
  proposed_by_role  VARCHAR(60),
  status            VARCHAR(20)   DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','applied')),
  reviewed_by       UUID          REFERENCES auth.users(id),
  reviewed_at       TIMESTAMPTZ,
  review_note       TEXT,
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pp_proposals_doc    ON pp_edit_proposals (doc_id);
CREATE INDEX IF NOT EXISTS idx_pp_proposals_status ON pp_edit_proposals (status);

-- AI conversation sessions scoped to the policy library
CREATE TABLE IF NOT EXISTS pp_ai_conversations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id),
  title       TEXT,                          -- auto-generated from first message
  messages    JSONB       DEFAULT '[]',      -- [{role, content, timestamp, citations}]
  doc_ids     TEXT[],                        -- which policies were referenced
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pp_ai_user ON pp_ai_conversations (user_id);

-- Regulatory alerts — flags when regulations may require policy updates
CREATE TABLE IF NOT EXISTS pp_regulatory_alerts (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id        VARCHAR(20)   REFERENCES pp_policies(doc_id),
  alert_type    VARCHAR(30)   DEFAULT 'regulation_change'
                CHECK (alert_type IN ('regulation_change','personnel_change','review_due','ai_flagged')),
  title         TEXT          NOT NULL,
  description   TEXT,
  regulatory_ref TEXT,                       -- e.g. "COMAR 10.07.05.08"
  severity      VARCHAR(10)   DEFAULT 'medium'
                CHECK (severity IN ('low','medium','high','critical')),
  status        VARCHAR(20)   DEFAULT 'open'
                CHECK (status IN ('open','in-progress','resolved','dismissed')),
  created_by    UUID          REFERENCES auth.users(id),
  resolved_by   UUID          REFERENCES auth.users(id),
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pp_alerts_doc    ON pp_regulatory_alerts (doc_id);
CREATE INDEX IF NOT EXISTS idx_pp_alerts_status ON pp_regulatory_alerts (status);

-- RLS
ALTER TABLE pp_policy_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pp_edit_proposals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pp_ai_conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pp_regulatory_alerts  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read versions" ON pp_policy_versions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins manage versions" ON pp_policy_versions
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

CREATE POLICY "Auth users read proposals" ON pp_edit_proposals
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins manage proposals" ON pp_edit_proposals
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));

CREATE POLICY "Users read own AI chats" ON pp_ai_conversations
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users manage own AI chats" ON pp_ai_conversations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Auth users read alerts" ON pp_regulatory_alerts
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins manage alerts" ON pp_regulatory_alerts
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')));
