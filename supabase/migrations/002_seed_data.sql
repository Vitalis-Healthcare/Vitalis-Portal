-- ============================================================
-- VITALIS PORTAL — SEED DATA
-- Migration 002: Default credential types and sample categories
-- ============================================================

INSERT INTO credential_types (name, validity_days, required_for_roles, reminder_days) VALUES
  ('CPR Certification',        365,  '["caregiver","supervisor","admin"]', '[30,14,7]'),
  ('First Aid Certificate',    730,  '["caregiver","supervisor"]',         '[60,30,14]'),
  ('Background Check',         365,  '["caregiver","supervisor","admin"]', '[60,30,14]'),
  ('TB Test / Screening',      365,  '["caregiver","supervisor"]',         '[30,14,7]'),
  ('CNA License',              730,  '["caregiver"]',                      '[60,30,14]'),
  ('Driver''s License',        1825, '["caregiver"]',                      '[90,60,30]'),
  ('I-9 Work Authorization',   0,    '["caregiver","supervisor","admin"]', '[0]'),
  ('HIPAA Training Certificate', 365,'["caregiver","supervisor","admin"]', '[30,14]')
ON CONFLICT (name) DO NOTHING;

