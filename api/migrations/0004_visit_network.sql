-- The network a visit came from (Cloudflare's request.cf.asOrganization), used
-- to tag visits from hosting/cloud networks as likely bots in /admin/visits.
-- Visits logged before this have ''.
ALTER TABLE visits ADD COLUMN network TEXT NOT NULL DEFAULT '';
