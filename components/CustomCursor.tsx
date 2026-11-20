"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * A lime dot that tracks the pointer exactly, with a ring that trails it.
 * Over links and buttons the ring swells into an inverted disc; over anything
 * with `data-cursor="Label"` it becomes a lime badge showing that label;
 * inside `data-cursor-hide` it gets out of the way entirely.
 *
 * Desktop only — skipped for touch and for reduced motion, where the native
 * cursor is left alone.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;

    document.documentElement.classList.add("has-custom-cursor");

    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });

    let shown = false;
    let mode: "idle" | "link" | "label" | "hidden" = "idle";

    const setMode = (next: typeof mode, text = "") => {
      if (next === mode && label.textContent === text) return;
      mode = next;
      label.textContent = text;
      ring.dataset.mode = next;
      gsap.to(ring, {
        scale: next === "label" ? 2.1 : next === "link" ? 1.5 : next === "hidden" ? 0 : 1,
        duration: 0.35,
        ease: "power3.out",
      });
      gsap.to(dot, { scale: next === "idle" ? 1 : 0, duration: 0.2 });
    };

    const onMove = (event: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.set([dot, ring], { x: event.clientX, y: event.clientY });
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      }
      dotX(event.clientX);
      dotY(event.clientY);
      ringX(event.clientX);
      ringY(event.clientY);
    };

    const onOver = (event: PointerEvent) => {
      const target = event.target as Element | null;
      // Areas that draw their own pointer (the paddle court).
      if (target?.closest("[data-cursor-hide]")) return setMode("hidden");
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      if (labelled) return setMode("label", labelled.dataset.cursor ?? "");
      if (target?.closest("a, button, [role='button']")) return setMode("link");
      setMode("idle");
    };

    const onLeave = () => {
      shown = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
    };

    const onDown = () => gsap.to(ring, { scale: "-=0.25", duration: 0.15 });
    const onUp = () =>
      gsap.to(ring, {
        scale: mode === "label" ? 2.1 : mode === "link" ? 1.5 : mode === "hidden" ? 0 : 1,
        duration: 0.3,
      });

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver);
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      gsap.killTweensOf([dot, ring]);
    };
  }, []);

  return (
    <div aria-hidden="true">
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" data-mode="idle">
        <span ref={labelRef} className="cursor-label" />
      </div>
    </div>
  );
}
