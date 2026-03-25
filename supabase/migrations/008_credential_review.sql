ALTER TABLE staff_credentials ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'approved';
ALTER TABLE staff_credentials ADD COLUMN IF NOT EXISTS submitted_notes text;
