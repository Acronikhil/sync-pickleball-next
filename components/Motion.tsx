"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * All of the public page's scroll and entrance motion, driven by data
 * attributes on the section components:
 *
 *   data-hero-word       headline words that rise in on load
 *   data-reveal          fades up when scrolled into view
 *   data-clip            image frame that wipes open when scrolled into view
 *   data-parallax="n"    drifts n% vertically while it crosses the viewport
 *   data-hero-bg         the header photo, which zooms out as you scroll away
 *
 * Mounted only on the public page, never in the admin preview. Starting
 * states live in globals.css, keyed off the `.js` flag set in the layout —
 * which is skipped for reduced motion, so this bails out in that case too.
 */
export function Motion() {
  useEffect(() => {
    if (!document.documentElement.classList.contains("js")) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-hero-word]",
        { opacity: 0, yPercent: 60, rotate: 4 },
        {
          opacity: 1,
          yPercent: 0,
          rotate: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.09,
          delay: 0.15,
        }
      );

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        // Header content plays on load; it can sit below a scroll trigger's
        // start line on short screens and would otherwise never appear.
        const inHero = el.closest("#top") !== null;
        gsap.fromTo(
          el,
          { opacity: 0, y: 48 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            delay: (Number(el.dataset.reveal) || 0) + (inHero ? 0.4 : 0),
            scrollTrigger: inHero
              ? undefined
              : { trigger: el, start: "top 88%", once: true },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-clip]").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(18% 12% 18% 12% round 2rem)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 2rem)",
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 95%",
              end: "top 35%",
              scrub: 0.6,
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const amount = Number(el.dataset.parallax) || 10;
        gsap.fromTo(
          el,
          { yPercent: -amount },
          {
            yPercent: amount,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      const heroBg = document.querySelector("[data-hero-bg]");
      if (heroBg) {
        gsap.fromTo(
          heroBg,
          { scale: 1.15 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: heroBg.parentElement,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      }
    });

    // Desktop: pin each gallery and turn vertical scroll into a sideways
    // glide. Below this width the strip stays a native swipeable scroller.
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      gsap.utils.toArray<HTMLElement>("[data-gallery]").forEach((section) => {
        const viewport = section.querySelector<HTMLElement>("[data-gallery-viewport]");
        const track = section.querySelector<HTMLElement>("[data-gallery-track]");
        if (!viewport || !track) return;

        gsap.set(viewport, { overflowX: "visible" });
        const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

        gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            // Created after the reveal triggers further down the page, so it
            // must be measured first or their start points ignore the pin.
            refreshPriority: 1,
          },
        });
      });
    });

    // Images load after first layout; re-measure so triggers line up.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      mm.revert();
      ctx.revert();
    };
  }, []);

  return null;
}
