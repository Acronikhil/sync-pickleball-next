import type { BodySection, SiteContent } from "@/lib/content";
import { Hero } from "./sections/Hero";
import { Feature } from "./sections/Feature";
import { Trio } from "./sections/Trio";
import { Cta } from "./sections/Cta";
import { SiteFooter } from "./SiteFooter";

function renderSection(section: BodySection) {
  switch (section.type) {
    case "feature":
      return <Feature key={section.id} data={section} />;
    case "trio":
      return <Trio key={section.id} data={section} />;
    case "cta":
      return <Cta key={section.id} data={section} />;
    default:
      return null;
  }
}

/**
 * Renders the entire page from content. Shared by the public page and the
 * admin's live preview, which is the point: what the admin sees while editing
 * is produced by the same code that builds production.
 */
export function SiteRenderer({ content }: { content: SiteContent }) {
  return (
    <div className="site-root">
      <Hero data={content.hero} />
      {content.sections.map(renderSection)}
      <SiteFooter socials={content.socials} footer={content.footer} />
    </div>
  );
}
