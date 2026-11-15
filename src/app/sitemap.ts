import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE = "https://justinharrison.dev";

// Pages for search engines to crawl. /resume is listed because the nav links
// to resume.pdf, so crawlers wouldn't otherwise find the HTML version.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/about", "/resume", "/resume.pdf", "/scratch", "/scratch/snake"].map((path) => ({
    url: `${BASE}${path}`,
  }));
}
