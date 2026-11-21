import type { MetadataRoute } from "next";

/**
 * The web app manifest: the name, colours and icons a phone uses when
 * someone adds the site to their home screen. Replaces the empty one the
 * favicon generator produced.
 */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sync Pickleball Club & Café",
    short_name: "Sync",
    description: "Indore's first premium pickleball club and café.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0820",
    theme_color: "#0d0820",
    icons: [
      { src: "/assets/favicon_io_sync/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/assets/favicon_io_sync/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
