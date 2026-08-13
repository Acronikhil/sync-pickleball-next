import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";

/**
 * Emitted as a static /robots.txt at build time.
 *
 * While this site lives on a subdomain alongside the live www site, it serves
 * identical content — so crawlers are turned away entirely to avoid duplicate
 * content. Flip NEXT_PUBLIC_ALLOW_INDEXING to "true" when this becomes the
 * real site. The /admin editor is never worth indexing either way.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  if (!siteConfig.site.allowIndexing) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/admin/" }],
    sitemap: `${siteConfig.site.url}/sitemap.xml`,
  };
}
