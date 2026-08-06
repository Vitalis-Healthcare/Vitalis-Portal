-- v0.6.43 — atomic lead-to-client conversion RPC (Ship 4b).
-- Applied by hand in the Supabase SQL Editor (Vita project ttojfvyfxqyzwvuzhvtd)
-- on 6 August 2026, one statement at a time, followed by the PostgREST
-- schema reload. Verified via pg_proc. This file is the repo record.

CREATE OR REPLACE FUNCTION public.convert_lead_to_client(
  p_lead_id          uuid,
  p_actor            uuid,
  p_payer_type       text,
  p_won_date         date,
  p_timeline_content text
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_lead      public.leads%ROWTYPE;
  v_client_id uuid;
  v_created   boolean := false;
BEGIN
  SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;
  IF v_lead.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'This lead is archived. Restore it before converting.';
  END IF;
  IF v_lead.status = 'won' THEN
    RAISE EXCEPTION 'This lead is already converted (won).';
  END IF;

  -- Resolve the client record: the linked one wins; a half-linked row
  -- claiming this lead is reused; otherwise create from the lead.
  v_client_id := v_lead.assessment_client_id;
  IF v_client_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.assessment_clients WHERE id = v_client_id) THEN
    v_client_id := NULL;
  END IF;
  IF v_client_id IS NULL THEN
    SELECT id INTO v_client_id
      FROM public.assessment_clients WHERE lead_id = p_lead_id LIMIT 1;
  END IF;

  IF v_client_id IS NOT NULL THEN
    UPDATE public.assessment_clients
       SET payer_type = p_payer_type,
           status     = 'active',
           updated_at = now()
     WHERE id = v_client_id;
  ELSE
    INSERT INTO public.assessment_clients
      (full_name, date_of_birth, phone, address, city, state, zip,
       payer_type, notes, status, lead_id, created_by)
    VALUES (
      trim(coalesce(nullif(v_lead.client_name, ''), v_lead.full_name)),
      v_lead.date_of_birth, v_lead.phone, v_lead.address, v_lead.city,
      coalesce(nullif(v_lead.state, ''), 'MD'), v_lead.zip,
      p_payer_type, 'Created on conversion from the lead pipeline.',
      'active', p_lead_id, p_actor
    )
    RETURNING id INTO v_client_id;
    v_created := true;
  END IF;

  UPDATE public.leads
     SET status               = 'won',
         won_date             = coalesce(won_date, p_won_date),
         assessment_client_id = v_client_id,
         updated_at           = now()
   WHERE id = p_lead_id;

  INSERT INTO public.lead_activities (lead_id, created_by, activity_type, content)
  VALUES (
    p_lead_id, p_actor, 'status_change',
    p_timeline_content || CASE WHEN v_created
      THEN ' — client record created'
      ELSE ' — linked client record reused' END
  );

  RETURN jsonb_build_object('client_id', v_client_id, 'client_created', v_created);
END;
$$;

NOTIFY pgrst, 'reload schema';
