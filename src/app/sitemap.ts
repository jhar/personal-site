import type { MetadataRoute } from "next";
import { entries } from "./scratch/haiku/haikus";

export const dynamic = "force-static";

const BASE = "https://justinharrison.dev";

// Pages for search engines to crawl. /resume is listed because the nav links
// to resume.pdf, so crawlers wouldn't otherwise find the HTML version.
export default function sitemap(): MetadataRoute.Sitemap {
  const haiku = entries.map(({ slug }) => `/scratch/haiku/${slug}`);
  const paths = ["/", "/about", "/resume", "/resume.pdf", "/scratch", "/scratch/snake", "/scratch/haiku"];
  return [...paths, ...haiku].map((path) => ({ url: `${BASE}${path}` }));
}
