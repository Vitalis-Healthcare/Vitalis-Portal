-- Ship 5b (v0.6.46): lead_consents — the signable Service Agreement /
-- Consent Form. One row per prepared agreement; token-gated public signing;
-- one LIVE link per lead (enforced by a partial unique index AND by the
-- prepare route voiding prior links); signed rows are immutable in practice
-- (the sign route only transitions sent/viewed → signed).
-- Run each statement separately in the Supabase SQL Editor (Vita project
-- ttojfvyfxqyzwvuzhvtd), then the verify statement.

-- Statement 1 of 4
CREATE TABLE lead_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'sent',
  agreement_version text NOT NULL,
  prefill jsonb NOT NULL,
  directives jsonb,
  signer_name text,
  signer_role text,
  signature_kind text,
  signature_data text,
  rep_name text NOT NULL,
  rep_signature_kind text NOT NULL,
  rep_signature_data text NOT NULL,
  rep_signed_at timestamptz NOT NULL DEFAULT now(),
  sent_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  email_id uuid REFERENCES lead_emails(id) ON DELETE SET NULL,
  viewed_at timestamptz,
  signed_at timestamptz,
  voided_at timestamptz,
  signed_html text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Statement 2 of 4
ALTER TABLE lead_consents ENABLE ROW LEVEL SECURITY;

-- Statement 3 of 4
CREATE INDEX lead_consents_lead_id_idx ON lead_consents (lead_id, created_at DESC);

-- Statement 4 of 4
CREATE UNIQUE INDEX lead_consents_live_key ON lead_consents (lead_id) WHERE status IN ('sent', 'viewed');
