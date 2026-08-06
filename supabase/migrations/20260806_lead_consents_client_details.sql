-- Ship 5b.1 (v0.6.47): the client completes/corrects their own identity
-- details on the signing page. `prefill` keeps what STAFF entered;
-- `client_details` records what the CLIENT submitted. The signed snapshot
-- prints the client's answers over the staff prefill; both are retained so
-- any correction is auditable after the fact.
-- Run in the Supabase SQL Editor, VITA project (ttojfvyfxqyzwvuzhvtd).

-- Statement 1 of 1
ALTER TABLE lead_consents ADD COLUMN client_details jsonb;
