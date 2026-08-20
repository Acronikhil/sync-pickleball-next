import { SiteRenderer } from "@/components/SiteRenderer";
import { PickleballCursor } from "@/components/PickleballCursor";
import { siteContent } from "@/lib/site-content";

/**
 * The public site. Fully pre-rendered at build time from content/site.json, so
 * crawlers get real HTML and nothing depends on a runtime API. Scroll and
 * entrance animation is GSAP, registered per-section (see lib/gsapScroll.ts) —
 * there's no longer a global animation-library init needed here.
 */
export default function HomePage() {
  return (
    <>
      {siteContent.cursor.enabled && (
        <PickleballCursor image={siteContent.cursor.image} />
      )}
      <SiteRenderer content={siteContent} />
    </>
  );
}
