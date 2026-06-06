import { FreshContext } from "$fresh/server.ts";

export async function handler(req: Request, ctx: FreshContext) {
  const url = new URL(req.url);

  // Skip static assets and admin route itself
  if (
    url.pathname.startsWith("/_fresh") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.match(/\.[a-z]+$/i)
  ) {
    return ctx.next();
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const country = req.headers.get("x-deno-geo-country") ?? "unknown";
  const city = req.headers.get("x-deno-geo-city") ?? "unknown";
  const region = req.headers.get("x-deno-geo-region") ?? "unknown";

  try {
    const kv = await Deno.openKv();
    const key = ["visits", Date.now().toString(), crypto.randomUUID()];
    await kv.set(
      key,
      {
        ip,
        country,
        region,
        city,
        path: url.pathname,
        referrer: req.headers.get("referer") ?? "",
        userAgent: req.headers.get("user-agent") ?? "",
        ts: new Date().toISOString(),
      },
      { expireIn: 1000 * 60 * 60 * 24 * 90 },
    );
  } catch {
    // Never let logging break the app
  }

  return ctx.next();
}
