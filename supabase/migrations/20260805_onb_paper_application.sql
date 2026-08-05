-- v0.6.36: paper application on file (documents-only track).
-- Who recorded that a paper (or prior AxisCare) application exists, when, and
-- where it lives. The note is free text - e.g. "AxisCare applicant #1234,
-- applied 2024" or "paper application filed at the Silver Spring office".
-- Read by the contract gate: for documents_only candidates this attestation
-- stands in for a submitted online application. One statement.
ALTER TABLE onb_candidates
  ADD COLUMN IF NOT EXISTS paper_application_at   timestamptz,
  ADD COLUMN IF NOT EXISTS paper_application_by   uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS paper_application_note text;
