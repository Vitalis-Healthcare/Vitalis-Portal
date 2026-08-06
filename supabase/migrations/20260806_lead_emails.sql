-- Ship 5a (v0.6.45): lead_emails — one row per outbound email sent from a
-- lead workspace. Immutable audit of exactly what went out (full HTML
-- snapshot), plus the status trail the v0.6.47 Resend webhook will update.
-- Run each statement separately in the Supabase SQL Editor (Vita project
-- ttojfvyfxqyzwvuzhvtd), confirming output before the next.

-- Statement 1 of 4
CREATE TABLE lead_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES lead_activities(id) ON DELETE SET NULL,
  sent_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  to_email text NOT NULL,
  from_email text NOT NULL,
  subject text NOT NULL,
  html text NOT NULL,
  template_key text,
  resend_id text,
  status text NOT NULL DEFAULT 'sent',
  failure_reason text,
  delivered_at timestamptz,
  bounced_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Statement 2 of 4
ALTER TABLE lead_emails ENABLE ROW LEVEL SECURITY;

-- Statement 3 of 4
CREATE INDEX lead_emails_lead_id_idx ON lead_emails (lead_id, created_at DESC);

-- Statement 4 of 4
CREATE INDEX lead_emails_resend_id_idx ON lead_emails (resend_id) WHERE resend_id IS NOT NULL;
