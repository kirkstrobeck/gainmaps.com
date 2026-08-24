import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: root,
  reactStrictMode: true,
  // Let our /ingest/flags/ rewrite fire before Next.js redirects the trailing slash.
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "plus.unsplash.com", pathname: "/**" },
    ],
    // Normalize to one quality value to eliminate build warnings and runtime drift.
    qualities: [75],
  },
  async rewrites() {
    return [
      // Specific rewrite strips trailing slash on /flags to avoid PostHog 308 redirect.
      {
        source: "/ingest/flags/",
        destination: "https://us.i.posthog.com/flags",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // CSP: PostHog proxied same-origin via /ingest. Fonts self-hosted via next/font.
            // Unsplash images fetched via next/image (same-origin optimizer) or direct img.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://images.unsplash.com https://plus.unsplash.com",
              "font-src 'self'",
              "connect-src 'self' https://us.i.posthog.com",
              "worker-src 'self' blob:",
              "frame-src https://giscus.app",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
