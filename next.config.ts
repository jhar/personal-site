import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Production is a static export served by Workers static assets, with /api/*
// handled by the Python Worker (api/src). In dev, `wrangler dev` runs that
// Worker locally and Next proxies to it.
const nextConfig: NextConfig = isDev
  ? {
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: `http://localhost:${process.env.API_PORT ?? 8787}/api/:path*`,
        },
      ];
    },
  }
  : {
    output: "export",
    images: { unoptimized: true },
  };

export default nextConfig;
