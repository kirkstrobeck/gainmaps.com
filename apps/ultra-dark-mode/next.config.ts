import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: root,
  reactStrictMode: true,
};

export default nextConfig;
