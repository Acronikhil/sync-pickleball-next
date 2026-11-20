"use client";

import { useEffect, useRef, useState } from "react";
import type { ThemeSpec } from "@/lib/themes";

type Kind = Exclude<ThemeSpec["particles"], "none">;

interface Particle {
  x: number;
  y: number;
  /** 0 (far) … 1 (near): drives size, speed, opacity and parallax. */
  z: number;
  size: number;
  phase: number;
  spin: number;
  /** Index into the kind's palette / sprite list. */
  hue: number;
}

const CONFETTI = ["#d8f65a", "#b7a2f2", "#8a5cff", "#ff8a65", "#f7f4ff", "#ffd166"];
const POWDER = ["#e2407a", "#f2a52b", "#39b37a", "#4a7be0", "#a35ce0"];

/** Soft round sprite in a colour, for snow, embers and powder. */
function glowSprite(inner: string, mid: string, outer: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.45, mid);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

/**
 * Festive particles over the whole page, drawn on one fixed canvas:
 *   snow      soft flakes drifting down
 *   confetti  tumbling paper bits
 *   embers    warm sparks rising (Diwali)
 *   colors    slow clouds of coloured powder (Holi)
 *
 * Particles sit at different depths: nearer ones are bigger and faster and
 * shift more with scrolling. Moving the mouse sideways stirs a little wind.
 * It pauses while the tab is hidden, scales the count to the screen, and
 * stays off for reduced motion. Visitors can switch it off with the toggle;
 * that choice is remembered on their device.
 *
 * Public page only (fixed-position), mounted from app/page.tsx.
 */
export function FestiveParticles({ kind, icon }: { kind: Kind; icon: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const prefKey = `sync-particles-${kind}`;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAllowed(true);
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(prefKey);
    } catch {}
    setOn(saved !== "off");
  }, [prefKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!on || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Pre-rendered soft sprites — far cheaper than shadowBlur per particle.
    const sprites =
      kind === "snow"
        ? [glowSprite("rgba(255,255,255,1)", "rgba(247,244,255,0.85)", "rgba(247,244,255,0)")]
        : kind === "embers"
          ? [glowSprite("rgba(255,244,200,1)", "rgba(255,170,60,0.75)", "rgba(255,120,30,0)")]
          : kind === "colors"
            ? POWDER.map((c) => glowSprite(hexA(c, 0.55), hexA(c, 0.25), hexA(c, 0)))
            : [];

    const rising = kind === "embers";
    let w = 0;
    let h = 0;
    let parts: Particle[] = [];

    const spawn = (anywhere: boolean): Particle => {
      const z = Math.random() ** 1.6; // mostly distant, a few close
      const base =
        kind === "colors" ? 30 + z * 70 : kind === "confetti" ? 5 + z * 6 : kind === "embers" ? 1.5 + z * 3 : 1.2 + z * 4.2;
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : rising ? h + 10 : -10,
        z,
        size: base,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        hue: Math.floor(Math.random() * (kind === "colors" ? POWDER.length : CONFETTI.length)),
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const density = kind === "colors" ? 90000 : kind === "confetti" ? 18000 : kind === "embers" ? 22000 : 14000;
      const target = Math.round(Math.min(140, Math.max(kind === "colors" ? 8 : 30, (w * h) / density)));
      while (parts.length < target) parts.push(spawn(true));
      parts.length = target;
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
      wind = Math.max(-3, Math.min(3, wind * 0.96));
      const shift = scrollShift;
      scrollShift = 0;

      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        const speed =
          kind === "colors" ? 0.15 + p.z * 0.35 : kind === "confetti" ? 0.9 + p.z * 1.6 : kind === "embers" ? -(0.4 + p.z * 1.1) : 0.35 + p.z * 1.3;
        p.y += speed - shift * (0.15 + p.z * 0.35);
        p.x += Math.sin(t * 0.01 + p.phase) * (0.2 + p.z * 0.5) + wind * (0.4 + p.z) + (kind === "colors" ? 0.25 : 0);
        p.phase += p.spin * 0.1;

        const off = p.size + 20;
        if (!rising && p.y > h + off) Object.assign(p, spawn(false), { y: -off });
        if (rising && p.y < -off) Object.assign(p, spawn(false), { y: h + off });
        if (p.y < -off - 40) p.y = h + off;
        if (p.y > h + off + 40) p.y = -off;
        if (p.x > w + off) p.x = -off;
        if (p.x < -off) p.x = w + off;

        if (kind === "confetti") {
          // A paper strip that tumbles: flip by squashing one axis.
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.phase * 3);
          ctx.scale(1, Math.cos(t * 0.05 + p.phase * 4));
          ctx.globalAlpha = 0.55 + p.z * 0.45;
          ctx.fillStyle = CONFETTI[p.hue];
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
          continue;
        }

        const sprite = sprites[kind === "colors" ? p.hue : 0];
        const size = p.size * 2.4;
        ctx.globalAlpha =
          kind === "embers"
            ? (0.45 + p.z * 0.5) * (0.7 + 0.3 * Math.sin(t * 0.15 + p.phase * 5)) // flicker
            : kind === "colors"
              ? 0.35 + p.z * 0.3
              : 0.35 + p.z * 0.55;
        ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
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
  }, [on, kind]);

  if (!allowed) return null;

  const noun = kind === "snow" ? "snow" : kind === "embers" ? "sparks" : kind === "colors" ? "colours" : "confetti";
  const toggle = () => {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem(prefKey, next ? "on" : "off");
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
        aria-label={on ? `Turn ${noun} off` : `Turn ${noun} on`}
        title={on ? `Turn ${noun} off` : `Turn ${noun} on`}
        className={`fixed bottom-4 left-4 z-45 grid size-11 cursor-pointer place-items-center rounded-full border border-white/15 p-0 text-lg backdrop-blur-md transition-all md:bottom-6 md:left-6 ${
          on ? "bg-white/15 text-cream" : "bg-night/60 text-cream/50 grayscale"
        }`}
      >
        <span aria-hidden="true">{icon}</span>
      </button>
    </>
  );
}
