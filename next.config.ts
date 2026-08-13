import type { NextConfig } from "next";

/**
 * GitHub Pages serves plain files, so the whole site is pre-rendered to ./out.
 * - `trailingSlash` makes /admin resolve to /admin/index.html on Pages.
 * - `images.unoptimized` is required: the Next image optimizer needs a server.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
