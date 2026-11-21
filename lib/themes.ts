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
  edge: "none" | "snow" | "lights" | "bunting";
  /** Flag colours, for the bunting edge. */
  bunting?: string[];
  /** What hangs over the header photo (see HangingDecor). */
  hanging: "none" | "baubles" | "lanterns" | "stars" | "splashes";
  /** Colour of the glow behind the header text. */
  glow?: string;
  /** The ticker band's colours, replacing the everyday lime. */
  ticker?: { background: string; text: string; icon: string };
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
    hanging: "none",
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
    hanging: "baubles",
    glow: "rgb(200 40 61 / 0.35)",
    ticker: { background: "#1f7a4d", text: "#f7f4ff", icon: "#ff5a6e" },
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
    hanging: "stars",
    glow: "rgb(224 184 74 / 0.3)",
    bunting: ["#d8f65a", "#8a5cff", "#ffd166", "#ff8a65", "#b7a2f2"],
    ticker: { background: "linear-gradient(90deg, #f5d76e, #e0b84a, #f5d76e)", text: "#0d0820", icon: "#6a4fc0" },
    particles: "confetti",
    toggleIcon: "🎉",
    edge: "bunting",
    mounds: false,
    outfit: "party",
    defaultMessage: "Happy New Year! Start the year with a rally 🎉",
    marquee: ["Happy New Year"],
    banner: "linear-gradient(90deg, #6a4fc0, #c04fb3 50%, #d8a23a)",
  },
  diwali: {
    label: "Diwali",
    hanging: "lanterns",
    glow: "rgb(245 158 11 / 0.35)",
    ticker: { background: "#f59e0b", text: "#2a1206", icon: "#b91c1c" },
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
    hanging: "splashes",
    glow: "rgb(226 64 122 / 0.3)",
    bunting: ["#e2407a", "#f2a52b", "#39b37a", "#4a7be0", "#a35ce0"],
    ticker: { background: "linear-gradient(90deg, #ff8fb3, #ffd166, #8ee6a8, #8fb8ff, #c9a2ff)", text: "#0d0820", icon: "#e2407a" },
    particles: "colors",
    toggleIcon: "🎨",
    edge: "bunting",
    mounds: false,
    outfit: "holi",
    defaultMessage: "Happy Holi! Come play in colour 🎨",
    marquee: ["Happy Holi"],
    banner: "linear-gradient(90deg, #e2407a, #f2a52b 35%, #39b37a 65%, #4a7be0)",
  },
  anniversary: {
    label: "Club anniversary",
    hanging: "stars",
    glow: "rgb(138 92 255 / 0.4)",
    ticker: { background: "#b7a2f2", text: "#0d0820", icon: "#6a4fc0" },
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
 * A festival booked for a date range. Dates are "YYYY-MM-DD" in India time,
 * and both ends are included: start "2026-12-20", end "2026-12-26" is live
 * for all seven days.
 */
export interface ScheduledTheme {
  id: string;
  name: ThemeName;
  /** Banner text; empty uses the festival's default. */
  message: string;
  start: string;
  end: string;
}

interface ThemedContent {
  theme?: { name: ThemeName; message: string };
  themeSchedule?: ScheduledTheme[];
  snow?: { enabled: boolean };
}

/**
 * Today's date in India as "YYYY-MM-DD". The site is built ahead of time, so
 * this is the date of the build; the deploy workflow rebuilds every night
 * just after midnight India time so scheduled festivals switch on time.
 */
export function todayInIndia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export type ScheduleStatus = "live" | "upcoming" | "ended" | "incomplete";

export function scheduleStatus(entry: ScheduledTheme, today = todayInIndia()): ScheduleStatus {
  if (!DATE.test(entry.start) || !DATE.test(entry.end) || entry.end < entry.start) return "incomplete";
  if (today < entry.start) return "upcoming";
  if (today > entry.end) return "ended";
  return "live";
}

/** The scheduled festival live today. If several overlap, the one that started most recently wins. */
export function liveScheduledTheme(
  schedule: ScheduledTheme[] = [],
  today = todayInIndia()
): ScheduledTheme | undefined {
  return schedule
    .filter((entry) => entry.name !== "none" && scheduleStatus(entry, today) === "live")
    .sort((a, b) => b.start.localeCompare(a.start))[0];
}

/**
 * The theme picked by hand ("right now"), ignoring the schedule. Older
 * content has no `theme` field but may have the earlier `snow` switch,
 * which meant Christmas.
 */
export function manualTheme(content: ThemedContent): { name: ThemeName; message: string } {
  return {
    name: content.theme?.name ?? (content.snow?.enabled ? "christmas" : "none"),
    message: content.theme?.message ?? "",
  };
}

/**
 * The theme visitors see on a given day: a scheduled festival if one covers
 * that day, otherwise the one picked by hand.
 */
export function activeTheme(
  content: ThemedContent,
  today = todayInIndia()
): { name: ThemeName; spec: ThemeSpec; message: string; scheduled?: ScheduledTheme } {
  const scheduled = liveScheduledTheme(content.themeSchedule, today);
  const picked = scheduled ?? manualTheme(content);
  const spec = THEMES[picked.name] ?? THEMES.none;
  const message = picked.message?.trim() || spec.defaultMessage;
  return { name: picked.name, spec, message, scheduled };
}
