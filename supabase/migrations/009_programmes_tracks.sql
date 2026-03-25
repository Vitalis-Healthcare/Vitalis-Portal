CREATE TABLE IF NOT EXISTS programmes (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  audience text,
  frequency text,
  pass_mark integer DEFAULT 80,
  cert_on_completion boolean DEFAULT true,
  est_hours numeric,
  total_modules integer,
  status text DEFAULT 'not_started',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tracks (
  id text PRIMARY KEY,
  programme_id text REFERENCES programmes(id),
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  colour_hex text,
  order_index integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS programme_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  programme_id text REFERENCES programmes(id),
  enrolled_at timestamptz DEFAULT now(),
  due_date date,
  completed_at timestamptz,
  assigned_by uuid,
  status text DEFAULT 'enrolled'
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS programme_id text REFERENCES programmes(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS track_id text REFERENCES tracks(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS lms_module_id text UNIQUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS badge text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS objectives text[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS order_index integer;

ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE programme_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read programmes" ON programmes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read tracks" ON tracks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage programmes" ON programmes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor'))
  );

CREATE POLICY "Admins can manage tracks" ON tracks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor'))
  );

CREATE POLICY "Users can read own programme enrollments" ON programme_enrollments
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor')
  ));

CREATE POLICY "Admins can manage programme enrollments" ON programme_enrollments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','supervisor'))
  );
