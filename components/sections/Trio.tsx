import type { TrioSection } from "@/lib/content";
import { RichText } from "../RichText";

/**
 * Amenity cards as an expanding photo strip. On desktop the cards share a row
 * and whichever one is hovered (or focused) widens and reveals its copy; on
 * smaller screens they stack with the copy always shown.
 */
export function Trio({ data }: { data: TrioSection }) {
  return (
    <section id={data.id} className="scroll-mt-24 px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:h-[36rem] lg:flex-row">
        {data.cards.map((card, index) => (
          <article
            key={card.id}
            tabIndex={0}
            data-reveal={index * 0.1}
            data-cursor="Explore"
            className="group relative isolate min-h-[26rem] flex-1 overflow-hidden rounded-4xl bg-plum transition-[flex-grow] duration-700 ease-[cubic-bezier(.2,.8,.2,1)] lg:min-h-0 lg:hover:grow-[2.2] lg:focus-within:grow-[2.2] lg:focus:grow-[2.2]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.image.src}
              alt={card.image.alt}
              loading="lazy"
              className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/40 to-transparent" />

            <span className="absolute left-6 top-6 grid size-11 place-items-center rounded-full border border-white/25 bg-night/30 font-display text-sm font-semibold backdrop-blur-md">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <h3 className="font-display text-3xl font-bold leading-[0.95] tracking-tight md:text-4xl">
                <RichText value={card.title} />
              </h3>
              <div className="grid transition-[grid-template-rows,opacity] duration-700 lg:grid-rows-[0fr] lg:opacity-0 lg:group-hover:grid-rows-[1fr] lg:group-hover:opacity-100 lg:group-focus:grid-rows-[1fr] lg:group-focus:opacity-100">
                <p className="overflow-hidden pt-4 text-sm leading-relaxed text-mist/80 md:max-w-md md:text-base">
                  {card.body}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
