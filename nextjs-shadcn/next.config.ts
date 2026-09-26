import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  experimental: {
    inlineCss: process.env.BENCHMARK_INLINE_CSS === "1",
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
