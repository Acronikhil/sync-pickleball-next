/**
 * Festival themes: one switch in /admin that dresses the whole site for an
 * occasion. Each theme picks from a small set of building blocks, so adding a
 * new festival is a matter of adding an entry here.
 */

export const THEME_NAMES = [
  "none",
  "christmas",
  "newyear",
  "diwali",
  "holi",
  "anniversary",
] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

export interface ThemeSpec {
  /** Shown in the admin's dropdown. */
  label: string;
  /** What drifts across the screen (see FestiveParticles). */
  particles: "none" | "snow" | "confetti" | "embers" | "colors";
  /** Icon on the visitor's on/off toggle for the particles. */
  toggleIcon: string;
  /** What sits on the top edge of the court and booking panel. */
  edge: "none" | "snow" | "lights";
  /** Snow mounds under the penguins' feet. */
  mounds: boolean;
  /** What the penguin wears. */
  outfit: "none" | "santa" | "party" | "garland" | "holi";
  /** Banner text used when the admin leaves the message empty. */
  defaultMessage: string;
  /** Extra word(s) slipped into the lime ticker. */
  marquee: string[];
  /** Banner background. */
  banner: string;
}

export const THEMES: Record<ThemeName, ThemeSpec> = {
  none: {
    label: "None (everyday look)",
    particles: "none",
    toggleIcon: "",
    edge: "none",
    mounds: false,
    outfit: "none",
    defaultMessage: "",
    marquee: [],
    banner: "",
  },
  christmas: {
    label: "Christmas",
    particles: "snow",
    toggleIcon: "❄",
    edge: "snow",
    mounds: true,
    outfit: "santa",
    defaultMessage: "Merry Christmas from Sync! Festive games all week 🎄",
    marquee: ["Merry Christmas"],
    banner: "linear-gradient(90deg, #b3263a, #6a4fc0 55%, #1f7a4d)",
  },
  newyear: {
    label: "New Year",
    particles: "confetti",
    toggleIcon: "🎉",
    edge: "none",
    mounds: false,
    outfit: "party",
    defaultMessage: "Happy New Year! Start the year with a rally 🎉",
    marquee: ["Happy New Year"],
    banner: "linear-gradient(90deg, #6a4fc0, #c04fb3 50%, #d8a23a)",
  },
  diwali: {
    label: "Diwali",
    particles: "embers",
    toggleIcon: "✨",
    edge: "lights",
    mounds: false,
    outfit: "garland",
    defaultMessage: "Happy Diwali! May your year be bright and your rallies long 🪔",
    marquee: ["Happy Diwali"],
    banner: "linear-gradient(90deg, #a8431a, #d98b1f 50%, #6a4fc0)",
  },
  holi: {
    label: "Holi",
    particles: "colors",
    toggleIcon: "🎨",
    edge: "none",
    mounds: false,
    outfit: "holi",
    defaultMessage: "Happy Holi! Come play in colour 🎨",
    marquee: ["Happy Holi"],
    banner: "linear-gradient(90deg, #e2407a, #f2a52b 35%, #39b37a 65%, #4a7be0)",
  },
  anniversary: {
    label: "Club anniversary",
    particles: "confetti",
    toggleIcon: "🎉",
    edge: "lights",
    mounds: false,
    outfit: "party",
    defaultMessage: "It's our anniversary! Thank you for playing with us 💜",
    marquee: ["Happy Anniversary"],
    banner: "linear-gradient(90deg, #6a4fc0, #8a5cff 50%, #b8d64a)",
  },
};

/**
 * The active theme for some content. Older content has no `theme` field but
 * may have the earlier `snow` switch, which meant Christmas.
 */
export function activeTheme(content: {
  theme?: { name: ThemeName; message: string };
  snow?: { enabled: boolean };
}): { name: ThemeName; spec: ThemeSpec; message: string } {
  const name: ThemeName =
    content.theme?.name ?? (content.snow?.enabled ? "christmas" : "none");
  const spec = THEMES[name] ?? THEMES.none;
  const message = content.theme?.message?.trim() || spec.defaultMessage;
  return { name, spec, message };
}
