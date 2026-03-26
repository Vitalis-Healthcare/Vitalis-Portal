-- Migration 028 — Credential Document History
-- Stores every uploaded document version per credential.
-- staff_credentials.document_url continues to hold the latest URL for
-- backwards compatibility. This table holds the full audit trail.

CREATE TABLE IF NOT EXISTS credential_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credential_id   UUID NOT NULL REFERENCES staff_credentials(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_by     UUID REFERENCES profiles(id),
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS credential_documents_credential_id
  ON credential_documents (credential_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS credential_documents_user_id
  ON credential_documents (user_id, uploaded_at DESC);

ALTER TABLE credential_documents ENABLE ROW LEVEL SECURITY;

-- Caregivers can view their own documents
CREATE POLICY "cred_docs_own_read" ON credential_documents
  FOR SELECT USING (user_id = auth.uid());

-- Staff, supervisors, and admins can view all documents
CREATE POLICY "cred_docs_admin_read" ON credential_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'supervisor', 'staff')
    )
  );

-- Only authenticated users can insert (upload)
CREATE POLICY "cred_docs_insert" ON credential_documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
