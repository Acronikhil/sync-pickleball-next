import type { HeroSection } from "@/lib/content";
import { ActionButton } from "../ActionButton";
import { Icon } from "../Icon";

/**
 * Full-bleed photo header. The heading is split into words so each can rise
 * in on its own; the last word picks up the lime accent ("SYNC.").
 */
export function Hero({ data }: { data: HeroSection }) {
  const words = data.heading.split(/\s+/).filter(Boolean);
  const book = data.buttons.find((b) => b.emphasis === "primary" && b.href);

  return (
    <section
      id="top"
      className="relative isolate flex min-h-[calc(100svh-var(--banner-h,0px))] items-end overflow-hidden px-4 pb-12 pt-28 sm:px-6 md:pb-16"
    >
      {data.background?.src && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-hero-bg
            src={data.background.src}
            alt={data.background.alt}
            className="size-full origin-bottom object-cover"
            fetchPriority="high"
          />
        </div>
      )}
      {/* Darken toward the copy, and tint toward the brand's night purple. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/70 to-night/20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night/80 via-court/10 to-transparent mix-blend-multiply" />
      <div className="absolute -left-40 top-1/3 -z-10 size-[36rem] rounded-full bg-court/40 blur-[120px]" />

      <div className="mx-auto grid w-full max-w-6xl items-end gap-12 lg:grid-cols-[1fr_auto]">
        <div>
          {/* Court tag: a squared plate with a little court diagram. */}
          <p
            data-reveal
            className="mb-6 inline-flex items-stretch overflow-hidden rounded-md border border-lime/40 bg-night/60 backdrop-blur-md"
          >
            <span className="grid place-items-center bg-lime px-2.5 text-night">
              <CourtGlyph />
            </span>
            <span className="flex flex-col justify-center px-3.5 py-1.5 leading-tight">
              <span className="font-display text-[0.7rem] font-bold uppercase tracking-[0.06em] text-cream">
                Pickleball Club &amp; Café
              </span>
              <span className="text-[0.72rem] text-mist/70">Indore, Madhya Pradesh</span>
            </span>
          </p>

          <h1
            className="font-display text-[clamp(2.5rem,min(8.4vw,11svh),7.4rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em]"
            aria-label={data.heading}
          >
            {words.map((word, index) => (
              <span key={index} className="inline-block overflow-hidden pb-[0.06em] align-top">
                <span
                  data-hero-word
                  aria-hidden="true"
                  className={`inline-block pr-[0.22em] ${
                    index === words.length - 1 ? "text-lime" : ""
                  }`}
                >
                  {word}
                </span>
              </span>
            ))}
          </h1>

          <p
            data-reveal="0.3"
            className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-mist/80 md:mt-7 md:text-lg"
          >
            {data.body}
          </p>

          <div data-reveal="0.45" className="mt-7 flex flex-wrap items-center gap-3 md:mt-9">
            {data.buttons.map((button) => (
              <ActionButton key={button.id} button={button} />
            ))}
          </div>
        </div>

        {/* Scoreboard card. Pickleball games open with the call "0, 0, 2",
            so it reads like the start of a game and links to booking. */}
        <a
          data-reveal="0.6"
          {...(book
            ? {
                href: book.href,
                ...(book.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {}),
              }
            : {})}
          className="group hidden w-60 shrink-0 -rotate-3 rounded-2xl border border-white/15 bg-night/75 p-4 shadow-2xl shadow-black/40 backdrop-blur-md transition-transform duration-500 hover:rotate-0 lg:block"
          // Decorative duplicate of the Book Now button, so keep it out of
          // the tab order and away from screen readers.
          tabIndex={-1}
          aria-hidden="true"
        >
          <span className="flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-[0.16em] text-mist/60">
            <span>Score call</span>
            <span>Game 1</span>
          </span>
          <span className="mt-3 flex items-center justify-center gap-1.5">
            {["0", "0", "2"].map((digit, index) => (
              <span key={index} className="flex items-center gap-1.5">
                {index > 0 && <span className="size-1.5 rounded-full bg-mist/40" />}
                <span className="grid h-14 w-11 place-items-center rounded-lg bg-black/50 font-display text-3xl font-extrabold text-lime shadow-[inset_0_0_12px_rgb(216_246_90/0.15)] [text-shadow:0_0_14px_rgb(216_246_90/0.6)]">
                  {digit}
                </span>
              </span>
            ))}
          </span>
          <span className="mt-2 block text-center text-xs text-mist/70">Your serve</span>
          <span className="mt-4 flex items-center justify-between rounded-xl bg-lime px-3.5 py-2.5 text-sm font-semibold text-night">
            Book a court
            <Icon name="arrow-right" className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </a>
      </div>
    </section>
  );
}

/** A tiny pickleball court from above: the net across the middle, the
    kitchen lines either side of it, and centre lines out to the baselines. */
function CourtGlyph() {
  return (
    <svg viewBox="0 0 28 18" className="h-[18px] w-7" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="1" y="1" width="26" height="16" rx="1.5" />
      <path d="M10 1v16M18 1v16M1 9h9M18 9h9" strokeWidth="1" />
      <path d="M14 0v18" strokeWidth="1.4" strokeDasharray="1.6 1.2" />
    </svg>
  );
}
