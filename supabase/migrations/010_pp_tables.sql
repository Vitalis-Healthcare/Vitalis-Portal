-- P&P Policy catalog (separate from the LMS courses table)
-- Uses doc_id as primary key per the architecture spec
CREATE TABLE IF NOT EXISTS pp_policies (
  doc_id            VARCHAR(20)   PRIMARY KEY,
  domain            VARCHAR(2)    NOT NULL,
  tier              SMALLINT      NOT NULL CHECK (tier IN (1, 2, 3)),
  title             TEXT          NOT NULL,
  owner_role        VARCHAR(60)   NOT NULL,
  version           VARCHAR(10)   NOT NULL,
  effective_date    DATE          NOT NULL,
  review_date       DATE          NOT NULL,
  applicable_roles  TEXT[]        NOT NULL,
  comar_refs        TEXT[],
  keywords          TEXT[],
  html_content      TEXT          NOT NULL,
  status            VARCHAR(20)   NOT NULL DEFAULT 'active'
                    CHECK (status IN ('draft','active','under-review','superseded')),
  superseded_by     VARCHAR(20)   REFERENCES pp_policies(doc_id),
  source_file       VARCHAR(100),
  imported_at       TIMESTAMPTZ   DEFAULT NOW(),
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pp_policies_roles   ON pp_policies USING GIN (applicable_roles);
CREATE INDEX IF NOT EXISTS idx_pp_policies_domain  ON pp_policies (domain);
CREATE INDEX IF NOT EXISTS idx_pp_policies_status  ON pp_policies (status);
CREATE INDEX IF NOT EXISTS idx_pp_policies_review  ON pp_policies (review_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_pp_policies_keywords ON pp_policies USING GIN (keywords);

-- Acknowledgment audit trail — immutable once written
CREATE TABLE IF NOT EXISTS pp_acknowledgments (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id          VARCHAR(20)   NOT NULL REFERENCES pp_policies(doc_id),
  doc_version     VARCHAR(10)   NOT NULL,
  user_id         UUID          NOT NULL,
  user_role       VARCHAR(60),
  acknowledged_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  ip_address      TEXT,
  UNIQUE (doc_id, doc_version, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pp_acks_user ON pp_acknowledgments (user_id);
CREATE INDEX IF NOT EXISTS idx_pp_acks_doc  ON pp_acknowledgments (doc_id);
CREATE INDEX IF NOT EXISTS idx_pp_acks_date ON pp_acknowledgments (acknowledged_at);

-- RLS
ALTER TABLE pp_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pp_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active policies" ON pp_policies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage policies" ON pp_policies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor'))
  );

CREATE POLICY "Users can read own acknowledgments" ON pp_acknowledgments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor'))
  );

CREATE POLICY "Authenticated users can insert own acknowledgments" ON pp_acknowledgments
  FOR INSERT WITH CHECK (user_id = auth.uid());
