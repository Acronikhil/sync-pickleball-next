/**
 * The content model behind the whole site.
 *
 * `content/site.json` is the single source of truth: the public pages render
 * from it at build time, and /admin edits it and commits it back to the repo.
 * Keep this file and the JSON in sync — the admin editor is generated from
 * these types, so adding a field here is how you make it editable.
 */

export const ICON_NAMES = [
  "none",
  "arrow-right",
  "arrow-down",
  "instagram",
  "phone",
  "envelope",
  "location",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export interface ImageRef {
  /** Site-root-relative path, e.g. /assets/images/image01.jpg */
  src: string;
  alt: string;
}

export interface Button {
  id: string;
  label: string;
  /** Empty string renders an inert button, matching the original markup. */
  href: string;
  icon: IconName;
  newTab: boolean;
  /** "primary" adds the lighter `active` treatment used by Book Now. */
  emphasis: "primary" | "secondary";
}

export interface HeroSection {
  id: string;
  type: "hero";
  logo: ImageRef;
  heading: string;
  body: string;
  buttons: Button[];
}

export interface FeatureSection {
  id: string;
  type: "feature";
  image: ImageRef;
  imageSide: "left" | "right";
  title: string;
  body: string;
  buttons: Button[];
}

export interface TrioCard {
  id: string;
  image: ImageRef;
  /** Supports the mini rich-text format — see formatRichText(). */
  title: string;
  body: string;
}

export interface TrioSection {
  id: string;
  type: "trio";
  cards: TrioCard[];
}

export interface CtaSection {
  id: string;
  type: "cta";
  /** Supports the mini rich-text format — see formatRichText(). */
  heading: string;
  body: string;
  buttons: Button[];
}

export type BodySection = FeatureSection | TrioSection | CtaSection;
export type SectionType = BodySection["type"];
export type AnySection = HeroSection | BodySection;

export interface SocialLink {
  id: string;
  icon: IconName;
  href: string;
  /** Accessible label — not rendered visually, the icon is. */
  label: string;
}

export interface FooterContent {
  copyright: string;
  creditPrefix: string;
  creditName: string;
  creditHref: string;
}

export interface SiteContent {
  /** Bumped when the shape changes, so old drafts can be detected. */
  version: number;
  hero: HeroSection;
  sections: BodySection[];
  socials: SocialLink[];
  footer: FooterContent;
  cursor: {
    enabled: boolean;
    image: string;
  };
}

/* ------------------------------------------------------------------ *
 * Mini rich-text format
 *
 * Headings on this site mix weights and line breaks inside a single
 * string ("Indoor Comfort," is half light). Rather than hand the admin a
 * raw HTML box, titles use two rules:
 *
 *   newline   -> line break
 *   _text_    -> lighter weight
 *
 * formatRichText() turns that into plain data; the renderer builds React
 * nodes from it, so nothing is ever injected as HTML.
 * ------------------------------------------------------------------ */

export interface RichTextToken {
  text: string;
  light: boolean;
}

/** Splits a rich-text string into lines of weight-tagged tokens. */
export function formatRichText(value: string): RichTextToken[][] {
  return value.split("\n").map((line) =>
    line
      .split(/(_[^_]+_)/g)
      .filter((part) => part.length > 0)
      .map((part) =>
        part.startsWith("_") && part.endsWith("_") && part.length > 1
          ? { text: part.slice(1, -1), light: true }
          : { text: part, light: false }
      )
  );
}

/** Creates the short unique ids used for sections, cards and buttons. */
export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A blank section of the given type, used by the admin's "Add section" menu. */
export function createSection(type: SectionType): BodySection {
  switch (type) {
    case "feature":
      return {
        id: createId("feature"),
        type: "feature",
        image: { src: "/assets/images/image01.jpg", alt: "" },
        imageSide: "left",
        title: "New section title",
        body: "Describe this part of the club.",
        buttons: [],
      };
    case "trio":
      return {
        id: createId("trio"),
        type: "trio",
        cards: [1, 2, 3].map((n) => ({
          id: createId("card"),
          image: { src: `/assets/images/image0${n + 2}.jpg`, alt: "" },
          title: `Card ${n}`,
          body: "Say something short and punchy.",
        })),
      };
    case "cta":
      return {
        id: createId("cta"),
        type: "cta",
        heading: "Ready to play?",
        body: "Grab your spot now!",
        buttons: [
          {
            id: createId("btn"),
            label: "Book Now",
            href: "https://hudle.in/venues/sync-pickleball-club-and-cafe-indore/649928",
            icon: "arrow-right",
            newTab: true,
            emphasis: "primary",
          },
        ],
      };
  }
}

/** A blank button, used by the admin's "Add button" control. */
export function createButton(): Button {
  return {
    id: createId("btn"),
    label: "New button",
    href: "",
    icon: "arrow-right",
    newTab: false,
    emphasis: "secondary",
  };
}
