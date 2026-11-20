"use client";

import { useEffect, useRef, useState } from "react";

const PREF_KEY = "sync-snow";

interface Flake {
  x: number;
  y: number;
  /** 0 (far) … 1 (near): drives size, speed, opacity and parallax. */
  z: number;
  r: number;
  phase: number;
}

/**
 * Gentle snowfall over the whole page, drawn on one fixed canvas.
 *
 * Flakes sit at different depths: nearer ones are bigger, faster and drift
 * more with scrolling. Moving the mouse sideways stirs a little wind. It
 * pauses while the tab is hidden, scales the flake count to the screen, and
 * stays off for reduced motion. Visitors can switch it off with the ❄ button;
 * that choice is remembered on their device.
 *
 * Public page only (fixed-position), mounted from app/page.tsx.
 */
export function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAllowed(true);
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(PREF_KEY);
    } catch {}
    setOn(saved !== "off");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!on || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // One soft round sprite, scaled per flake — far cheaper than shadowBlur.
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext("2d")!;
    const glow = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.45, "rgba(247,244,255,0.85)");
    glow.addColorStop(1, "rgba(247,244,255,0)");
    sctx.fillStyle = glow;
    sctx.fillRect(0, 0, 64, 64);

    let w = 0;
    let h = 0;
    let dpr = 1;
    let flakes: Flake[] = [];

    const spawn = (anywhere: boolean): Flake => {
      const z = Math.random() ** 1.6; // mostly distant, a few close
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -10,
        z,
        r: 1.2 + z * 4.2,
        phase: Math.random() * Math.PI * 2,
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(140, Math.max(35, (w * h) / 14000)));
      while (flakes.length < target) flakes.push(spawn(true));
      flakes.length = target;
    };
    resize();

    let wind = 0;
    let lastMouseX: number | null = null;
    const onMouse = (event: MouseEvent) => {
      if (lastMouseX !== null) wind += (event.clientX - lastMouseX) * 0.004;
      lastMouseX = event.clientX;
    };

    let lastScroll = window.scrollY;
    let scrollShift = 0;
    const onScroll = () => {
      scrollShift += window.scrollY - lastScroll;
      lastScroll = window.scrollY;
    };

    let frame = 0;
    let t = 0;
    const tick = () => {
      t += 1;
      wind *= 0.96;
      wind = Math.max(-3, Math.min(3, wind));
      const shift = scrollShift;
      scrollShift = 0;

      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        const speed = 0.35 + f.z * 1.3;
        f.y += speed - shift * (0.15 + f.z * 0.35);
        f.x += Math.sin(t * 0.01 + f.phase) * (0.2 + f.z * 0.5) + wind * (0.4 + f.z);

        if (f.y > h + 10) Object.assign(f, spawn(false));
        if (f.y < -20) f.y = h + 5;
        if (f.x > w + 10) f.x = -10;
        if (f.x < -10) f.x = w + 10;

        const size = f.r * 2.4;
        ctx.globalAlpha = 0.35 + f.z * 0.55;
        ctx.drawImage(sprite, f.x - size / 2, f.y - size / 2, size, size);
      }
      frame = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(tick);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      ctx.clearRect(0, 0, w, h);
    };
  }, [on]);

  if (!allowed) return null;

  const toggle = () => {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem(PREF_KEY, next ? "on" : "off");
    } catch {}
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-45 size-full transition-opacity duration-700 ${
          on ? "opacity-100" : "opacity-0"
        }`}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "Turn snow off" : "Turn snow on"}
        title={on ? "Turn snow off" : "Let it snow"}
        className={`fixed bottom-4 left-4 z-45 grid size-11 cursor-pointer place-items-center rounded-full border border-white/15 p-0 text-lg backdrop-blur-md transition-colors md:bottom-6 md:left-6 ${
          on ? "bg-white/15 text-cream" : "bg-night/60 text-cream/50"
        }`}
      >
        <span aria-hidden="true">❄</span>
      </button>
    </>
  );
}
