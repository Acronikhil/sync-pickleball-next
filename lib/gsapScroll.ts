"use client";

/**
 * Shared GSAP scroll-reveal hook.
 *
 * This is the one thing every section uses instead of AOS: mark the elements
 * that should animate in with a class, point the hook at a container, and
 * they fade/scale/slide up as the container crosses into view, staggered.
 *
 * Two things this guards against, both learned from the AOS version it
 * replaces:
 *  - `prefers-reduced-motion` skips straight to the final state.
 *  - Inside the admin panel's live-preview pane (its own scrolling <div>,
 *    not the window), ScrollTrigger's default window-based trigger would
 *    never fire, leaving content stuck at opacity 0. Rather than teach every
 *    call site about the preview's scroller, content inside `.a-preview-pane`
 *    just renders in its final state immediately — the point of the preview
 *    is to show what's being edited, not to re-run entrance animation on
 *    every keystroke anyway.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let scrollTriggerRegistered = false;

function ensureScrollTrigger() {
  if (!scrollTriggerRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    scrollTriggerRegistered = true;
  }
}

export interface ScrollRevealOptions {
  /** Starting vertical offset in px. Default 40. */
  y?: number;
  /** Starting scale. Default 0.94. */
  scale?: number;
  /** Seconds per element. Default 0.8. */
  duration?: number;
  /** Seconds between staggered elements. Default 0.12. */
  stagger?: number;
  /** ScrollTrigger `start` value. Default "top 82%". */
  start?: string;
}

export function useScrollReveal<T extends HTMLElement>(
  selector: string,
  options: ScrollRevealOptions = {}
) {
  const containerRef = useRef<T>(null);
  const { y = 40, scale = 0.94, duration = 0.8, stagger = 0.12, start = "top 82%" } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targets = container.querySelectorAll<HTMLElement>(selector);
    if (targets.length === 0) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const inAdminPreview = container.closest(".a-preview-pane") !== null;

    if (reduceMotion || inAdminPreview) {
      gsap.set(targets, { opacity: 1, y: 0, scale: 1, clearProps: "transform" });
      return;
    }

    ensureScrollTrigger();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y, scale },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration,
          stagger,
          ease: "back.out(1.5)",
          scrollTrigger: {
            trigger: container,
            start,
            toggleActions: "play none none reverse",
          },
        }
      );
    }, container);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, y, scale, duration, stagger, start]);

  return containerRef;
}
