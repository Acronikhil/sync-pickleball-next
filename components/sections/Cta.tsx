"use client";

import type { CtaSection } from "@/lib/content";
import { ActionButton } from "../ActionButton";
import { RichText } from "../RichText";
import { useScrollReveal } from "@/lib/gsapScroll";

export function Cta({ data }: { data: CtaSection }) {
  const ref = useScrollReveal<HTMLDivElement>(".reveal-item", { y: 30, stagger: 0.15 });

  return (
    <section id={data.id} className="relative isolate overflow-hidden px-4 py-20 sm:py-28">
      <div
        className="blob animate-float-slow left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 bg-funky-lime/20"
        aria-hidden="true"
      />
      <div
        className="blob animate-float-slower -right-10 bottom-0 h-64 w-64 bg-funky-yellow/20"
        aria-hidden="true"
      />

      <div ref={ref} className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <h2 className="reveal-item gradient-text font-display text-4xl font-bold leading-tight sm:text-5xl">
          <RichText value={data.heading} />
        </h2>
        <p className="reveal-item text-lg text-white/70">{data.body}</p>

        <div className="reveal-item flex flex-wrap items-center justify-center gap-4">
          {data.buttons.map((button) =>
            button.emphasis === "primary" ? (
              <span
                key={button.id}
                className="inline-block animate-pulse-glow rounded-full"
              >
                <ActionButton button={button} />
              </span>
            ) : (
              <ActionButton key={button.id} button={button} />
            )
          )}
        </div>
      </div>
    </section>
  );
}
