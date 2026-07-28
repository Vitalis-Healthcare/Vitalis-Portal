-- ============================================================
-- v0.6.24-c — conversion approval notifications
--
-- THIS FILE IS OPTIONAL. The release needs no migration.
--
-- With no row here, approval requests go to every profiles row with
-- role = 'admin' and status = 'active'. That is almost certainly what
-- you want, and it stays correct as admins come and go.
--
-- Run the statement below ONLY if you want to override that with a
-- fixed list — for example to include someone who is not an admin, or
-- to route approvals to a shared mailbox during leave.
-- ============================================================

-- Comma-separated. Blank or absent means "every active admin".
INSERT INTO portal_settings (key, value, updated_at)
VALUES ('conversion_approval_recipients', 'okezie@vitalishealthcare.com', now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- To go back to the automatic list, blank it out:
--   UPDATE portal_settings SET value = '' WHERE key = 'conversion_approval_recipients';
