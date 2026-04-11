-- v0.5.7 — Drop the deprecated cf_transactions table.
--
-- Background: cf_transactions was the original daybook table. As of v0.5.5
-- all daybook writes go to cf_actual_items with source='manual'. As of
-- v0.5.7 the only remaining reader (reconcile/route.ts) has been rewired to
-- read cf_actual_items directly. There are no remaining code references.
--
-- Run this AFTER the v0.5.7 code merges to main and Vercel deploys.

drop table if exists cf_transactions;
