import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Production is a static export served from S3 + CloudFront, with /api/* routed
// to a Lambda by CloudFront. In dev, the same API runs locally (api/dev-server.ts)
// and Next proxies to it.
const nextConfig: NextConfig = isDev
  ? {
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: `http://localhost:${process.env.API_PORT ?? 3001}/api/:path*`,
        },
      ];
    },
  }
  : {
    output: "export",
    images: { unoptimized: true },
  };

export default nextConfig;
