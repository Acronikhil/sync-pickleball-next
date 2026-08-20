"use client";

import type { FeatureSection } from "@/lib/content";
import { ActionButton } from "../ActionButton";
import { useScrollReveal } from "@/lib/gsapScroll";

/**
 * The wide feature rows. `imageSide` flips the columns on desktop while the
 * image always leads on mobile, matching the original ordering. The gradient
 * "glow card" border is a real gradient background peeking through a 2px
 * padding gap, not a border — CSS borders can't do multi-color gradients.
 */
export function Feature({ data }: { data: FeatureSection }) {
  const imageFirst = data.imageSide === "left";
  const ref = useScrollReveal<HTMLDivElement>(".reveal-item", { y: 50 });

  return (
    <section id={data.id} className="px-4 py-16 sm:py-24">
      <div
        ref={ref}
        className="mx-auto max-w-5xl rounded-[2.5rem] bg-[linear-gradient(120deg,var(--color-brand),var(--color-funky-pink),var(--color-funky-cyan))] bg-[length:200%_200%] p-[1.5px] transition-[background-position] duration-700 hover:bg-right"
      >
        <div className="flex flex-col items-center gap-8 rounded-[2.45rem] bg-[#1a1130]/80 p-6 backdrop-blur-sm sm:p-10 md:flex-row md:gap-10">
          <div
            className={`reveal-item order-1 w-full md:w-2/5 ${
              imageFirst ? "md:order-1" : "md:order-2"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.image.src}
              className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-xl shadow-black/30 transition-transform duration-500 ease-out hover:scale-[1.03] hover:-rotate-1"
              alt={data.image.alt}
            />
          </div>

          <div
            className={`reveal-item order-2 flex w-full flex-col items-center gap-4 text-center md:w-3/5 md:items-start md:text-left ${
              imageFirst ? "md:order-2" : "md:order-1"
            }`}
          >
            <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
              {data.title}
            </h2>
            <p className="text-white/70 leading-relaxed">{data.body}</p>
            {data.buttons.map((button) => (
              <ActionButton key={button.id} button={button} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
