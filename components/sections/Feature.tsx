import type { FeatureSection } from "@/lib/content";
import { ActionButton } from "../ActionButton";
import { FlowText } from "../FlowText";

/**
 * Editorial split row: a tall photo that wipes open as it scrolls in (with a
 * slow parallax inside the frame), beside an oversized index number, title and
 * copy. `imageSide` flips the columns on desktop; below that the photo always
 * comes first.
 */
export function Feature({
  data,
  index,
}: {
  data: FeatureSection;
  /** 1-based position among the page's feature rows, shown as "01", "02"… */
  index: number;
}) {
  const imageRight = data.imageSide === "right";

  return (
    <section id={data.id} className="scroll-mt-24 px-4 py-20 sm:px-6 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div
          className={`lg:col-span-7 ${imageRight ? "lg:order-2" : ""}`}
        >
          <div
            data-clip
            className="relative aspect-[4/5] overflow-hidden rounded-4xl bg-plum sm:aspect-[16/11] lg:aspect-[5/6]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              data-parallax="8"
              src={data.image.src}
              alt={data.image.alt}
              loading="lazy"
              className="absolute inset-x-0 -top-[10%] h-[120%] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-night/50 via-transparent to-transparent" />
          </div>
        </div>

        <div className={`lg:col-span-5 ${imageRight ? "lg:order-1" : ""}`}>
          <div data-reveal>
            <FlowText text={String(index).padStart(2, "0")} className="h-16 md:h-24" />
          </div>
          <h2
            data-reveal
            className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight text-cream md:text-5xl"
          >
            {data.title}
          </h2>
          <p data-reveal="0.1" className="mt-6 text-base leading-relaxed text-mist/75 md:text-lg">
            {data.body}
          </p>
          {data.buttons.length > 0 && (
            <div data-reveal="0.2" className="mt-9 flex flex-wrap gap-3">
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
