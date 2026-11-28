export interface Visit {
  ip: string;
  country: string;
  region: string;
  city: string;
  path: string;
  referrer: string;
  userAgent: string;
  ts: string;
  // Cloudflare's network name ("Comcast Cable", "DigitalOcean"); "" before it was logged.
  network?: string;
  // From the admin API: a short label if the visit looks automated, else "".
  bot?: string;
}
