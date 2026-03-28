import type { NextConfig } from "next";

// Electron production builds need static export (file:// protocol).
// Vercel + web dev use native Next.js for full performance.
const isElectronBuild = process.env.NEXT_BUILD_TARGET === "electron";

const nextConfig: NextConfig = {
  ...(isElectronBuild && {
    output: "export",
    trailingSlash: true,
  }),
  images: { unoptimized: true },
};

export default nextConfig;
