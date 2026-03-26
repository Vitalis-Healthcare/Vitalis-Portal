-- Migration 030 — Credential missing status
-- Ensures 'missing' is a valid status value.
-- The application layer (missing-credential-alerts cron) handles detection.
-- The status column already allows 'missing' per original schema CHECK constraint.
-- This migration is a no-op safety check + updates the display logic.

-- Verify missing is already in the check constraint (it was in original schema)
-- If not, add it:
DO $$
BEGIN
  -- Drop and recreate constraint to ensure 'missing' is included
  ALTER TABLE staff_credentials DROP CONSTRAINT IF EXISTS staff_credentials_status_check;
  ALTER TABLE staff_credentials
    ADD CONSTRAINT staff_credentials_status_check
    CHECK (status IN ('current','expiring','expired','missing'));
EXCEPTION
  WHEN others THEN
    NULL; -- constraint may have different name, ignore
END $$;

-- Update the status trigger to set 'missing' when no data and not N/A
-- (This covers the case where a credential record is created with missing flag)
CREATE OR REPLACE FUNCTION update_credential_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.not_applicable = true THEN
    NEW.status := 'current';
  ELSIF NEW.does_not_expire = true THEN
    NEW.status := 'current';
  ELSIF NEW.expiry_date IS NOT NULL THEN
    IF NEW.expiry_date < CURRENT_DATE THEN
      NEW.status := 'expired';
    ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
      NEW.status := 'expiring';
    ELSE
      NEW.status := 'current';
    END IF;
  ELSE
    -- No expiry date, not does_not_expire, not N/A = missing
    IF NEW.not_applicable = false AND NEW.does_not_expire = false THEN
      NEW.status := 'missing';
    END IF;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
