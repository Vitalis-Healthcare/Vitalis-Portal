ALTER TABLE section_progress ADD COLUMN IF NOT EXISTS score integer;
ALTER TABLE section_progress ADD COLUMN IF NOT EXISTS quiz_answers jsonb;
ALTER TABLE course_enrollments ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS section_progress_enrollment_section_idx
  ON section_progress (enrollment_id, section_id);
