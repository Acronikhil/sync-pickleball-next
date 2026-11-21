"use client";

import { useEffect, useRef, useState } from "react";
import type { ThemeSpec } from "@/lib/themes";
import { Penguin } from "./Penguin";

type Pose = "idle" | "wave" | "cheer";

/**
 * The penguin perched on the footer's "sync". It pops up and waves when the
 * footer scrolls into view, waves back on hover, and on a click hops, says
 * something and tosses a pickleball. Left alone it now and then waves or
 * hops on its own. Its eyes follow the pointer like every penguin's (see
 * PenguinGaze).
 *
 * Marked `data-footer-penguin` so the corner penguin can step aside while
 * this one is on screen.
 */
export function FooterPenguin({
  name,
  outfit,
  className = "",
}: {
  name: string;
  outfit: ThemeSpec["outfit"];
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [arrived, setArrived] = useState(false);
  const [pose, setPose] = useState<Pose>("idle");
  const [hover, setHover] = useState(false);
  const [line, setLine] = useState<string | null>(null);
  const [tosses, setTosses] = useState<number[]>([]);
  const lineIndex = useRef(0);
  const busyUntil = useRef(0);

  const lines = [
    `Hi, I'm ${name}!`,
    "Fancy a game?",
    "See you on court!",
    "Nice dink!",
    "Coffee after? 🧋",
    "Serve's yours!",
  ];

  // Pop up and wave the first time the footer comes into view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArrived(true);
          act("wave", 2200);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Now and then, when nobody is playing with it, it waves or hops.
  useEffect(() => {
    if (!arrived) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (Date.now() < busyUntil.current || document.hidden) return;
      act(Math.random() < 0.5 ? "wave" : "cheer", 1400);
    }, 6500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrived]);

  function act(next: Pose, ms: number) {
    busyUntil.current = Date.now() + ms;
    setPose(next);
    window.setTimeout(() => {
      if (Date.now() >= busyUntil.current) setPose("idle");
    }, ms);
  }

  function play() {
    act("cheer", 1600);
    setLine(lines[lineIndex.current % lines.length]);
    lineIndex.current += 1;
    window.setTimeout(() => setLine(null), 2200);
    // Toss a ball; each one cleans itself up after its arc.
    const id = Date.now();
    setTosses((all) => [...all, id]);
    window.setTimeout(() => setTosses((all) => all.filter((t) => t !== id)), 1300);
  }

  return (
    <button
      ref={ref}
      type="button"
      data-footer-penguin
      onClick={play}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      aria-label={`Play with ${name} the penguin`}
      className={`footer-penguin group cursor-pointer border-0 bg-transparent p-0 ${arrived ? "is-arrived" : ""} ${className}`}
    >
      <span className="footer-penguin-body block">
        <Penguin pose={hover && pose === "idle" ? "wave" : pose} outfit={outfit} className="w-full" />
      </span>

      {line && (
        <span
          key={line}
          role="status"
          className="footer-penguin-line absolute bottom-[92%] right-[55%] whitespace-nowrap rounded-2xl rounded-br-sm bg-cream px-3.5 py-2 font-display text-[clamp(0.7rem,1.3vw,0.9rem)] font-bold text-night shadow-xl shadow-black/40"
        >
          {line}
        </span>
      )}

      {tosses.map((id) => (
        <span key={id} className="footer-penguin-ball absolute left-[8%] top-[45%] size-[16%]" aria-hidden="true">
          <svg viewBox="0 0 20 20" className="size-full">
            <circle cx="10" cy="10" r="9.5" fill="#d8f65a" />
            <circle cx="7" cy="7" r="1.4" fill="#7f9a12" />
            <circle cx="13" cy="8" r="1.4" fill="#7f9a12" />
            <circle cx="9" cy="13" r="1.4" fill="#7f9a12" />
          </svg>
        </span>
      ))}
    </button>
  );
}
