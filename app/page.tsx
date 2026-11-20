import { preload } from "react-dom";
import { SiteRenderer } from "@/components/SiteRenderer";
import { CustomCursor } from "@/components/CustomCursor";
import { Motion } from "@/components/Motion";
import { PenguinBuddy } from "@/components/PenguinBuddy";
import { FestiveParticles } from "@/components/FestiveParticles";
import { siteContent } from "@/lib/site-content";
import { activeTheme } from "@/lib/themes";

/**
 * The public site. Fully pre-rendered at build time from content/site.json, so
 * crawlers get real HTML and nothing depends on a runtime API.
 *
 * [data-motion-root] opts this page (and not the admin preview, which renders
 * the same SiteRenderer) into the scroll-reveal starting states. The cursor,
 * festival particles and floating penguin are fixed-position, so they live here too
 * rather than in SiteRenderer, where they'd escape the admin's preview pane.
 */
export default function HomePage() {
  const book = siteContent.hero.buttons.find((b) => b.emphasis === "primary");
  // The header photo is the largest thing on screen; fetch it first.
  if (siteContent.hero.background?.src) {
    preload(siteContent.hero.background.src, { as: "image", fetchPriority: "high" });
  }
  const { spec: theme } = activeTheme(siteContent);

  return (
    <div data-motion-root>
      {siteContent.cursor.enabled && <CustomCursor />}
      <SiteRenderer content={siteContent} />
      {theme.particles !== "none" && (
        <FestiveParticles kind={theme.particles} icon={theme.toggleIcon} />
      )}
      <PenguinBuddy book={book} theme={theme} />
      <Motion />
    </div>
  );
}
