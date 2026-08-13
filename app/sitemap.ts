import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";

/** Emitted as a static /sitemap.xml. One public page, so this stays trivial. */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteConfig.site.url}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
