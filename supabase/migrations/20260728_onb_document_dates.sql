-- v0.6.21 — provenance + dates on candidate documents
--
-- Run as TWO separate statements in the Supabase SQL Editor, in this order.
-- Both are also pasted inline in the chat message that shipped this ZIP.

-- ── Statement 1 of 2 ────────────────────────────────────────────────────────
alter table onb_documents
  add column if not exists uploaded_by uuid references auth.users(id),
  add column if not exists issued_on   date,
  add column if not exists expires_on  date;

-- ── Statement 2 of 2 ────────────────────────────────────────────────────────
-- New columns stay invisible to PostgREST until it reloads its schema cache.
notify pgrst, 'reload schema';
