import type { CtaSection, ImageRef } from "@/lib/content";
import { ActionButton } from "../ActionButton";
import { Icon } from "../Icon";
import { RichText } from "../RichText";
import { EdgeDecor } from "../EdgeDecor";
import { THEMES, type ThemeSpec } from "@/lib/themes";

/**
 * The closing "book now" panel: a court-purple slab with faint court lines,
 * floating sparkles from the logo and, on wide screens, a couple of tilted
 * venue snapshots pinned to its corners.
 */
export function Cta({
  data,
  photos = [],
  theme = THEMES.none,
}: {
  data: CtaSection;
  photos?: ImageRef[];
  theme?: ThemeSpec;
}) {
  const [left, right] = photos;

  return (
    <section id={data.id} className="scroll-mt-24 px-4 py-20 sm:px-6 md:py-28">
      {/* The festival trim sits outside the panel, which clips its own contents. */}
      <div data-reveal className="relative mx-auto max-w-6xl">
      <EdgeDecor edge={theme.edge} seed={3} />
      <div
        className="relative isolate overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-court via-[#5537a8] to-plum px-6 py-20 text-center md:px-16 md:py-28"
      >
        <div className="court-lines absolute inset-0 -z-10 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="absolute -right-20 -top-20 -z-10 size-80 rounded-full bg-lilac/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 -z-10 size-80 rounded-full bg-lime/20 blur-3xl" />

        <Icon name="sparkle" className="absolute left-[10%] top-[18%] size-8 animate-float text-lime" />
        <Icon name="sparkle" className="absolute left-[16%] top-[30%] size-4 animate-float text-lime [animation-delay:-2s]" />
        <Icon name="sparkle" className="absolute bottom-[20%] right-[12%] size-6 animate-float text-cream/70 [animation-delay:-4s]" />

        {left && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={left.src}
            alt=""
            aria-hidden="true"
            className="absolute bottom-12 left-10 hidden h-56 w-44 -rotate-[9deg] rounded-2xl border-[6px] border-cream object-cover shadow-2xl shadow-night/60 xl:block"
          />
        )}
        {right && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={right.src}
            alt=""
            aria-hidden="true"
            className="absolute right-10 top-12 hidden h-56 w-44 rotate-[8deg] rounded-2xl border-[6px] border-cream object-cover shadow-2xl shadow-night/60 xl:block"
          />
        )}

        <h2 className="font-display text-[clamp(3rem,9vw,7.5rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.04em]">
          <RichText value={data.heading} accentClassName="font-serif normal-case italic font-normal tracking-normal text-lime" />
        </h2>
        <p className="mx-auto mt-8 max-w-lg text-lg text-mist/85">{data.body}</p>
        {data.buttons.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {data.buttons.map((button) => (
              <ActionButton key={button.id} button={button} />
            ))}
          </div>
        )}
      </div>
      </div>
    </section>
  );
}
