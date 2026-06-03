import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // legacy/ é um snapshot do projeto antigo — fora do build.
  outputFileTracingExcludes: {
    "*": ["./legacy/**"],
  },
};

export default nextConfig;
