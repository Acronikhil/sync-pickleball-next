"use client";

import type { TrioSection } from "@/lib/content";
import { RichText } from "../RichText";
import { useScrollReveal } from "@/lib/gsapScroll";

/**
 * Fixed accent per card position, cycling pink/cyan/yellow — full class
 * strings written out literally so Tailwind's build-time scanner can see
 * them (constructing them dynamically, e.g. `shadow-${color}/30`, wouldn't
 * be detected and would silently produce no CSS).
 */
const ACCENTS = [
  { bar: "bg-funky-pink", glow: "hover:shadow-funky-pink/25" },
  { bar: "bg-funky-cyan", glow: "hover:shadow-funky-cyan/25" },
  { bar: "bg-funky-yellow", glow: "hover:shadow-funky-yellow/25" },
];

export function Trio({ data }: { data: TrioSection }) {
  const ref = useScrollReveal<HTMLDivElement>(".reveal-item", { stagger: 0.15 });

  return (
    <section id={data.id} className="px-4 py-16 sm:py-24">
      <div
        ref={ref}
        className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {data.cards.map((card, index) => {
          const accent = ACCENTS[index % ACCENTS.length];
          return (
            <div
              key={card.id}
              className={`reveal-item group flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm transition-all duration-400 ease-out hover:-translate-y-2 hover:rotate-1 hover:border-white/25 hover:shadow-2xl ${accent.glow}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.image.src}
                className="aspect-[4/3] w-full rounded-2xl object-cover shadow-lg shadow-black/30 transition-transform duration-500 group-hover:scale-105"
                alt={card.image.alt}
              />
              <span className={`h-1.5 w-12 rounded-full ${accent.bar}`} aria-hidden="true" />
              <h3 className="font-display text-xl font-semibold text-white">
                <RichText value={card.title} />
              </h3>
              <p className="text-white/70 leading-relaxed">{card.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
