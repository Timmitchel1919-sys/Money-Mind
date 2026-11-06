import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright and local tooling use 127.0.0.1 while Next advertises localhost.
  // Without this explicit dev-only origin, split Turbopack chunks can be blocked.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
