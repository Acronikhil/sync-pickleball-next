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
          <p
            data-reveal
            className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-mist sm:text-xs sm:tracking-[0.2em] backdrop-blur-md"
          >
            <span className="size-2 animate-pulse-dot rounded-full bg-lime" />
            Pickleball Club &amp; Café · Indore
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

        {/* Rotating "book a court" badge wrapped around the logo. */}
        <a
          data-reveal="0.6"
          {...(book
            ? {
                href: book.href,
                ...(book.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {}),
              }
            : {})}
          className="group relative hidden size-44 shrink-0 lg:block"
          // Decorative duplicate of the Book Now button, so keep it out of
          // the tab order and away from screen readers.
          tabIndex={-1}
          aria-hidden="true"
        >
          <svg viewBox="0 0 200 200" className="absolute inset-0 animate-spin-slow text-cream/80" aria-hidden="true">
            <defs>
              <path id="badge-circle" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
            </defs>
            <text className="fill-current font-sans text-[14px] font-bold uppercase tracking-[0.28em]">
              <textPath href="#badge-circle">Book a court ✦ Serve ✦ Sip ✦ Repeat ✦</textPath>
            </text>
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.logo.src}
            alt=""
            className="absolute inset-9 size-[6.5rem] rounded-full shadow-2xl shadow-court/60 transition-transform duration-500 group-hover:scale-110"
          />
        </a>
      </div>

      <a
        href="#play"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-mist/60 md:flex"
      >
        Scroll
        <Icon name="arrow-down" className="size-4 animate-bounce" />
      </a>
    </section>
  );
}
