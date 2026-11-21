"use client";

import { useEffect } from "react";

/** Furthest the pupils travel from centre, in the penguin's SVG units. */
const REACH = 4;
/** Eye-line centre in the penguin's 120×140 viewBox (see Penguin.tsx). */
const EYE_X = 60 / 120;
const EYE_Y = 49 / 140;

/**
 * Makes every penguin on the page look at the pointer (or the last touch):
 * each one's pupils shift towards it, a little more the further away it is.
 * One listener drives them all, at most once per frame, and only penguins on
 * screen are touched. Skipped for reduced motion.
 *
 * Public page only, mounted from app/page.tsx.
 */
export function PenguinGaze() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let x = 0;
    let y = 0;
    let queued = false;

    const update = () => {
      queued = false;
      for (const svg of document.querySelectorAll<SVGSVGElement>("svg.penguin")) {
        const box = svg.getBoundingClientRect();
        if (box.bottom < 0 || box.top > window.innerHeight || box.width === 0) continue;
        const pupils = svg.querySelector<SVGGElement>(".penguin-pupils");
        if (!pupils) continue;

        const dx = x - (box.left + box.width * EYE_X);
        const dy = y - (box.top + box.height * EYE_Y);
        const dist = Math.hypot(dx, dy) || 1;
        // Ease towards full reach over ~300px, so nearby pointers don't
        // throw the eyes to the edge.
        const amount = REACH * Math.min(1, dist / 300);
        pupils.style.transform = `translate(${((dx / dist) * amount).toFixed(2)}px, ${((dy / dist) * amount).toFixed(2)}px)`;
      }
    };

    const onPointer = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onPointer, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  return null;
}
