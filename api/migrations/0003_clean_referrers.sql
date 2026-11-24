-- Some visits were logged with the literal string "undefined" (or "null") as
-- the referrer. Store those as empty, like every other missing referrer.
UPDATE visits SET referrer = '' WHERE lower(trim(referrer)) IN ('undefined', 'null');
