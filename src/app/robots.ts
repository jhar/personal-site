import type { MetadataRoute } from "next";

// Production robots.txt. Staging deploys replace it with a disallow-all file
// (see .github/workflows/deploy-env.yml), since both use the same build.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: "https://justinharrison.dev/sitemap.xml",
  };
}
