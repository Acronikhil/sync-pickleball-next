import type { BodySection, SiteContent } from "@/lib/content";
import { Hero } from "./sections/Hero";
import { Marquee } from "./sections/Marquee";
import { Feature } from "./sections/Feature";
import { Trio } from "./sections/Trio";
import { Gallery } from "./sections/Gallery";
import { ShotPicker, type Shot } from "./sections/ShotPicker";
import { Cta } from "./sections/Cta";
import { SiteNav, type NavLink } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

/**
 * Nav links point at the page's own sections, so they keep working as the
 * admin adds, removes or reorders them. Labels are short, fixed names per
 * section kind; section titles are too long for a nav bar.
 */
function navLinks(sections: BodySection[]): NavLink[] {
  const features = sections.filter((s) => s.type === "feature");
  const trio = sections.find((s) => s.type === "trio");
  const links: NavLink[] = [];
  if (features[0]) links.push({ href: `#${features[0].id}`, label: "The Club" });
  if (trio) links.push({ href: `#${trio.id}`, label: "Amenities" });
  const gallery = sections.find((s) => s.type === "gallery");
  if (gallery) links.push({ href: `#${gallery.id}`, label: "Gallery" });
  if (features.length > 1) {
    links.push({ href: `#${features[features.length - 1].id}`, label: "Community" });
  }
  links.push({ href: "#visit", label: "Visit" });
  return links;
}

/**
 * Renders the entire page from content. Shared by the public page and the
 * admin's live preview, which is the point: what the admin sees while editing
 * is produced by the same code that builds production.
 */
export function SiteRenderer({ content }: { content: SiteContent }) {
  const { hero, sections } = content;
  const book = hero.buttons.find((b) => b.emphasis === "primary");
  const marqueeWords = hero.heading
    .split(/\s+/)
    .map((word) => word.replace(/[.!,]+$/, ""))
    .filter(Boolean);

  // One ball per nav destination, plus booking if it has a link.
  const shots: Shot[] = navLinks(sections).map((link) => ({ ...link }));
  if (book?.href) shots.push({ label: book.label, href: book.href, newTab: book.newTab });

  // Snapshots for the CTA's corners: the first two feature photos.
  const ctaPhotos = sections.flatMap((s) => (s.type === "feature" ? [s.image] : [])).slice(0, 2);

  let featureCount = 0;
  function renderSection(section: BodySection) {
    switch (section.type) {
      case "feature":
        featureCount += 1;
        return <Feature key={section.id} data={section} index={featureCount} />;
      case "trio":
        return <Trio key={section.id} data={section} />;
      case "gallery":
        return <Gallery key={section.id} data={section} />;
      case "cta":
        return <Cta key={section.id} data={section} photos={ctaPhotos} />;
      default:
        return null;
    }
  }

  return (
    <div className="site-root grain">
      <SiteNav logo={hero.logo} links={navLinks(sections)} book={book} />
      <main>
        <Hero data={hero} />
        <Marquee words={marqueeWords} />
        <ShotPicker shots={shots} />
        {sections.map(renderSection)}
      </main>
      <SiteFooter socials={content.socials} footer={content.footer} logo={hero.logo} />
    </div>
  );
}
