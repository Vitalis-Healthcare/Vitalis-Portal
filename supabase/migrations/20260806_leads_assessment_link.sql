-- v0.6.42 — bidirectional lead <-> assessment-client link (Ship 4a).
-- Applied by hand in the Supabase SQL Editor (Vita project ttojfvyfxqyzwvuzhvtd)
-- on 6 August 2026, one statement at a time. This file is the repo record.

-- 1. The lead's pointer to its client record.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assessment_client_id uuid
  REFERENCES public.assessment_clients(id) ON DELETE SET NULL;

-- 2. The client record's pointer back to the lead.
ALTER TABLE public.assessment_clients
  ADD COLUMN IF NOT EXISTS lead_id uuid
  REFERENCES public.leads(id) ON DELETE SET NULL;

-- 3. No two client records may claim the same lead (NULLs unaffected).
CREATE UNIQUE INDEX IF NOT EXISTS assessment_clients_lead_id_key
  ON public.assessment_clients(lead_id)
  WHERE lead_id IS NOT NULL;
