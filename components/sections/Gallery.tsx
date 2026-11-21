import type { GallerySection } from "@/lib/content";
import { RichText } from "../RichText";

/**
 * A strip of venue photos. By default it's a native horizontal scroller with
 * snap points (phones, and the admin preview). On desktop <Motion /> pins the
 * section and turns vertical scrolling into a sideways glide along the strip.
 *
 * On desktop the section is exactly one viewport tall, and the strip is a size
 * container filling what's left after the nav and heading. Photos take that
 * height minus room for the caption (100cqh - 3rem), so nothing is cut off on
 * short laptop screens while it's pinned. Widths follow from an aspect ratio:
 * every third photo is wide, the rest tall.
 */
export function Gallery({ data }: { data: GallerySection }) {
  return (
    <section
      id={data.id}
      data-gallery
      className="scroll-mt-24 overflow-hidden py-20 md:py-28 lg:flex lg:h-svh lg:flex-col lg:pb-8 lg:pt-28"
    >
      <div className="mx-auto flex w-full max-w-6xl shrink-0 flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-end md:justify-between">
        <h2
          data-reveal
          className="font-display text-4xl font-bold leading-[0.95] tracking-tight md:text-6xl lg:text-[clamp(2.5rem,7svh,3.75rem)]"
        >
          <RichText
            value={data.heading}
            accentClassName="font-serif italic font-normal tracking-normal text-lime"
          />
        </h2>
        <div data-reveal="0.1" className="max-w-sm">
          <p className="text-mist/75 md:text-lg">{data.body}</p>
          <p className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-lilac">
            <span className="h-px w-10 bg-lilac/60" />
            <span className="lg:hidden">Swipe for more photos</span>
            <span className="hidden lg:inline">Keep scrolling, the photos glide by</span>
          </p>
        </div>
      </div>

      <div
        data-gallery-viewport
        className="mt-10 snap-x snap-mandatory overflow-x-auto scrollbar-none lg:mt-8 lg:min-h-0 lg:flex-1 lg:[container-type:size] [&::-webkit-scrollbar]:hidden"
      >
        <ul
          data-gallery-track
          className="flex w-max gap-4 px-4 sm:px-6 md:gap-6 lg:h-full lg:px-[max(1.5rem,calc((100vw-72rem)/2))]"
        >
          {data.images.map((photo, index) => {
            const wide = index % 3 === 1;
            return (
              <li
                key={photo.id}
                data-cursor="Scroll"
                className={`group shrink-0 snap-center lg:w-auto ${
                  wide ? "w-[85vw] sm:w-136" : "w-[70vw] sm:w-88"
                }`}
              >
                <div
                  className={`relative h-96 overflow-hidden rounded-3xl bg-plum md:h-112 lg:h-[calc(100cqh-3rem)] ${
                    wide ? "lg:aspect-[4/3]" : "lg:aspect-[3/4]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.image.src}
                    alt={photo.image.alt}
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
                </div>
                <p className="mt-4 flex shrink-0 items-baseline gap-3">
                  <span className="font-display text-sm font-semibold text-lime">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-mist/80">{photo.caption}</span>
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
