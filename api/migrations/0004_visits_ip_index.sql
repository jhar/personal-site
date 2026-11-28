-- Lets /api/visit count one IP's recent visits cheaply for its rate limit.
CREATE INDEX visits_ip ON visits (ip, ts);
