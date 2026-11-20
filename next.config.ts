import type { NextConfig } from "next";

/**
 * GitHub Pages serves plain files, so the whole site is pre-rendered to ./out.
 * - `trailingSlash` makes /admin resolve to /admin/index.html on Pages.
 * - `images.unoptimized` is required: the Next image optimizer needs a server.
 */
const nextConfig: NextConfig = {
  // Overridable so a test build doesn't overwrite the files a running
  // `next dev` is serving from .next. Set NODE_ENV too, or the /404 export
  // fails with "<Html> should not be imported outside of pages/_document":
  //   NODE_ENV=production NEXT_DIST_DIR=.next-build npm run build
  // With a custom distDir the exported site lands inside it, not in ./out.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
