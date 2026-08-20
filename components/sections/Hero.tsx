"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { HeroSection } from "@/lib/content";
import { ActionButton } from "../ActionButton";

/**
 * The hero. Runs its own GSAP entrance timeline on mount (it's always the
 * first thing on screen, so a scroll trigger has nothing to trigger from) —
 * logo bounces in, heading and paragraph settle after it, buttons pop in
 * with a stagger. Skipped under prefers-reduced-motion, and inside the
 * admin's live-preview pane elements just render in their final state
 * immediately, same reasoning as lib/gsapScroll.ts.
 */
export function Hero({ data }: { data: HeroSection }) {
  const rootRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const logo = logoRef.current;
    const heading = headingRef.current;
    const body = bodyRef.current;
    const buttons = buttonsRef.current;
    if (!root || !logo || !heading || !body || !buttons) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const inAdminPreview = root.closest(".a-preview-pane") !== null;
    const buttonEls = buttons.children;

    if (reduceMotion || inAdminPreview) {
      gsap.set([logo, heading, body, ...buttonEls], { opacity: 1, y: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "back.out(1.6)" } })
        .fromTo(logo, { opacity: 0, scale: 0.4, rotate: -12 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.9 })
        .fromTo(heading, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.35")
        .fromTo(body, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.4")
        .fromTo(
          buttonEls,
          { opacity: 0, y: 24, scale: 0.85 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.12 },
          "-=0.3"
        );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative isolate overflow-hidden px-4 pt-20 pb-24 sm:pt-28 sm:pb-32"
    >
      {/* Decorative ambient blobs — purely visual, GPU-cheap CSS drift. */}
      <div
        className="blob animate-float-slow -left-24 top-0 h-72 w-72 bg-funky-pink/30"
        aria-hidden="true"
      />
      <div
        className="blob animate-float-slower -right-20 top-24 h-80 w-80 bg-funky-cyan/25"
        aria-hidden="true"
      />
      <div
        className="blob animate-float-slow left-1/2 top-72 h-64 w-64 -translate-x-1/2 bg-brand/30"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <div ref={logoRef} className="relative">
          <div
            className="absolute inset-0 -z-10 scale-125 rounded-full bg-funky-pink/40 blur-2xl"
            aria-hidden="true"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.logo.src}
            className="w-[190px] max-w-full drop-shadow-[0_10px_25px_rgba(255,79,163,0.35)] sm:w-[220px]"
            alt={data.logo.alt}
          />
        </div>

        <h1
          ref={headingRef}
          className="gradient-text font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
        >
          {data.heading}
        </h1>

        <p ref={bodyRef} className="max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
          {data.body}
        </p>

        <div
          ref={buttonsRef}
          className="mt-2 flex w-full max-w-sm flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          {data.buttons.map((button) => (
            <ActionButton key={button.id} button={button} className="w-full sm:w-auto" />
          ))}
        </div>
      </div>
    </section>
  );
}
