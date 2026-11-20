import { SiteRenderer } from "@/components/SiteRenderer";
import { CustomCursor } from "@/components/CustomCursor";
import { Motion } from "@/components/Motion";
import { PenguinBuddy } from "@/components/PenguinBuddy";
import { siteContent } from "@/lib/site-content";

/**
 * The public site. Fully pre-rendered at build time from content/site.json, so
 * crawlers get real HTML and nothing depends on a runtime API.
 *
 * [data-motion-root] opts this page (and not the admin preview, which renders
 * the same SiteRenderer) into the scroll-reveal starting states. The cursor
 * and the floating penguin are fixed-position, so they live here too rather
 * than in SiteRenderer, where they'd escape the admin's preview pane.
 */
export default function HomePage() {
  const book = siteContent.hero.buttons.find((b) => b.emphasis === "primary");

  return (
    <div data-motion-root>
      {siteContent.cursor.enabled && <CustomCursor />}
      <SiteRenderer content={siteContent} />
      <PenguinBuddy book={book} />
      <Motion />
    </div>
  );
}
