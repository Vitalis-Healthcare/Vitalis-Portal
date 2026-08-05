-- v0.6.35: invite tracks on onb_candidates.
--   'full'             - today's flow: competency test first, then the application.
--   'application_only' - the test is skipped or deferred; the invite links
--                        straight to the application.
--   'documents_only'   - a paper application is on file; the candidate only
--                        uploads documents (candidate page lands in v0.6.36).
-- Free text like status: the permitted values are documented here, not CHECKed.
ALTER TABLE onb_candidates ADD COLUMN IF NOT EXISTS track text NOT NULL DEFAULT 'full';
