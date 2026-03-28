import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export required for Electron production build
  output: "export",
  // Trailing slash ensures correct file paths in Electron file:// protocol
  trailingSlash: true,
  // Disable image optimization (not available in static export)
  images: { unoptimized: true },
};

export default nextConfig;
