-- Snek-VG scoreboards, one for keyboard players and one for touch. id is the
-- game's one-time token nonce, so each game can be submitted once. ip_hash is a keyed hash of the player's IP, used only to
-- rate limit submissions; the IP itself is not stored and nothing here is
-- returned except initials, score, input, city, country and ts.
CREATE TABLE snek_scores (
  id       TEXT PRIMARY KEY,
  ts       TEXT NOT NULL,
  initials TEXT NOT NULL CHECK (
    length(initials) BETWEEN 1 AND 3 AND initials NOT GLOB '*[^A-Z]*'
  ),
  score    INTEGER NOT NULL CHECK (score > 0),
  input    TEXT NOT NULL CHECK (input IN ('keyboard', 'touch')),
  city     TEXT NOT NULL DEFAULT '',
  country  TEXT NOT NULL DEFAULT '',
  ip_hash  TEXT NOT NULL DEFAULT ''
);

CREATE INDEX snek_scores_rank ON snek_scores (input, score DESC, ts ASC);
CREATE INDEX snek_scores_ip ON snek_scores (ip_hash, ts);
CREATE INDEX snek_scores_ts ON snek_scores (ts);
