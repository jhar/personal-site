-- Visits never expire. ts is an ISO 8601 UTC timestamp, so it sorts as text.
CREATE TABLE visits (
  id         TEXT PRIMARY KEY,
  ts         TEXT NOT NULL,
  ip         TEXT NOT NULL DEFAULT '',
  country    TEXT NOT NULL DEFAULT '',
  region     TEXT NOT NULL DEFAULT '',
  city       TEXT NOT NULL DEFAULT '',
  path       TEXT NOT NULL DEFAULT '',
  referrer   TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT ''
);

CREATE INDEX visits_ts ON visits (ts DESC, id DESC);

-- Small key/value cache (the Letterboxd feed), shared by every Worker isolate.
CREATE TABLE cache (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  fetched_at REAL NOT NULL
);
