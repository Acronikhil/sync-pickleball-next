"use client";

import { useEffect, useRef } from "react";
import { Penguin } from "../Penguin";
import { EdgeDecor } from "../EdgeDecor";
import { THEMES, type ThemeSpec } from "@/lib/themes";

export interface Shot {
  label: string;
  /** "#section-id" scrolls the page; anything else is a URL to open. */
  href: string;
  newTab?: boolean;
}

interface Ball {
  el: HTMLButtonElement;
  shot: Shot;
  /** Resting spot as fractions of the court's width and height. */
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  flying: boolean;
  /** Frames since the launch, for the "it's gone, go there" timeout. */
  age: number;
}

const BALL_R = 28;
const PADDLE_R = 44;
const GRAVITY = 0.55;
/** Paddle speed (px/frame) above which contact launches the ball. */
const HIT_SPEED = 9;

/**
 * Resting spot for ball `i` of `n`, as fractions of the court. Wide courts
 * get one staggered row; narrow ones (phones) a grid of two rows, so the
 * labels have room and don't run off the edges.
 */
function homeFor(i: number, n: number, width: number): [number, number] {
  if (width < 640) {
    const cols = Math.ceil(n / 2);
    return [((i % cols) + 0.5) / cols, i < cols ? 0.3 : 0.68];
  }
  return [(i + 0.5) / n, i % 2 === 0 ? 0.42 : 0.66];
}

/**
 * "Pick your shot": a little court where the cursor is a paddle and each
 * ball is a destination. Swing through a ball and it flies off; once it's
 * gone the page heads to wherever that ball was labelled. A slow touch just
 * nudges it. Clicking, tapping or pressing Enter on a ball launches it too,
 * so it works on touch screens and from the keyboard.
 */
export function ShotPicker({
  shots,
  theme = THEMES.none,
}: {
  shots: Shot[];
  theme?: ThemeSpec;
}) {
  const courtRef = useRef<HTMLDivElement>(null);
  const paddleRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLParagraphElement>(null);
  const umpireRef = useRef<HTMLDivElement>(null);
  const launchRef = useRef<(index: number, vx?: number, vy?: number) => void>(() => {});

  useEffect(() => {
    const court = courtRef.current;
    const paddle = paddleRef.current;
    const toast = toastRef.current;
    if (!court || !paddle || !toast) return;

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = court.clientWidth;
    let height = court.clientHeight;

    const els = Array.from(court.querySelectorAll<HTMLButtonElement>("[data-ball]"));
    const balls: Ball[] = els.map((el, i) => {
      // Two staggered rows read more like balls scattered on a court.
      const [homeX, homeY] = homeFor(i, els.length, width);
      return {
        el,
        shot: shots[i],
        homeX,
        homeY,
        x: homeX * width,
        y: homeY * height,
        vx: 0,
        vy: 0,
        spin: 0,
        flying: false,
        age: 0,
      };
    });

    // Move the whole button, but spin only the ball graphic, not its label.
    const place = (ball: Ball) => {
      ball.el.style.transform = `translate(${ball.x - BALL_R}px, ${ball.y - BALL_R}px)`;
      const art = ball.el.firstElementChild as SVGElement | null;
      if (art) art.style.transform = `rotate(${ball.spin}deg)`;
    };

    // The umpire penguin cheers and calls the shot.
    let cheerTimer = 0;
    const goTo = (shot: Shot, fromGesture: boolean) => {
      const umpire = umpireRef.current?.querySelector("svg");
      toast.textContent = `Nice shot! Off to ${shot.label} →`;
      toast.dataset.show = "true";
      if (umpire) umpire.dataset.pose = "cheer";
      window.clearTimeout(cheerTimer);
      cheerTimer = window.setTimeout(() => {
        toast.dataset.show = "false";
        if (umpire) umpire.dataset.pose = "wave";
      }, 1600);

      if (shot.href.startsWith("#")) {
        document.querySelector(shot.href)?.scrollIntoView({ behavior: calm ? "auto" : "smooth" });
      } else if (shot.newTab && fromGesture) {
        window.open(shot.href, "_blank", "noopener,noreferrer");
      } else {
        // A paddle hit isn't a click, so browsers would block a pop-up;
        // open it in this tab instead.
        window.location.assign(shot.href);
      }
    };

    const respawn = (ball: Ball) => {
      ball.flying = false;
      ball.age = 0;
      ball.vx = ball.vy = ball.spin = 0;
      ball.x = ball.homeX * width;
      ball.y = ball.homeY * height;
      place(ball);
      ball.el.animate(
        [
          { scale: 0, opacity: 0 },
          { scale: 1.15, opacity: 1, offset: 0.7 },
          { scale: 1, opacity: 1 },
        ],
        { duration: 500, easing: "cubic-bezier(.2,.8,.2,1)" }
      );
    };

    let fromGesture = false;
    const launch = (index: number, vx?: number, vy?: number) => {
      const ball = balls[index];
      // age -1: already gone and waiting to respawn.
      if (!ball || ball.flying || ball.age === -1) return;
      if (calm) {
        goTo(ball.shot, true);
        return;
      }
      ball.flying = true;
      ball.age = 0;
      // Without a swing to copy (click/tap/key), lob it up and away from centre.
      ball.vx = vx ?? (ball.homeX - 0.5) * 22 + (Math.random() - 0.5) * 6;
      ball.vy = vy ?? -18 - Math.random() * 4;
      fromGesture = vx === undefined;
      start();
    };
    launchRef.current = launch;

    // ---- paddle ----
    let px = -999;
    let py = -999;
    let pvx = 0;
    let pvy = 0;
    let lastX = 0;
    let lastY = 0;
    let inside = false;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const rect = court.getBoundingClientRect();
      px = event.clientX - rect.left;
      py = event.clientY - rect.top;
      if (!inside) {
        inside = true;
        lastX = px;
        lastY = py;
        paddle.dataset.show = "true";
      }
      start();
    };
    const onLeave = () => {
      inside = false;
      paddle.dataset.show = "false";
    };

    // ---- loop ----
    let frame = 0;
    let running = false;
    // Arrow functions rather than declarations, so the null checks on
    // court/paddle above still narrow inside them.
    const start = () => {
      if (!running) {
        running = true;
        frame = requestAnimationFrame(tick);
      }
    };

    const tick = () => {
      // Smoothed paddle velocity, so one jittery frame doesn't count as a smash.
      pvx = pvx * 0.5 + (px - lastX) * 0.5;
      pvy = pvy * 0.5 + (py - lastY) * 0.5;
      lastX = px;
      lastY = py;

      if (inside) {
        const tilt = Math.max(-40, Math.min(40, pvx * 2.2));
        paddle.style.transform = `translate(${px}px, ${py}px) rotate(${-20 + tilt}deg)`;
      }

      let busy = inside;
      for (const ball of balls) {
        if (ball.flying) {
          busy = true;
          ball.age += 1;
          ball.vy += GRAVITY;
          ball.x += ball.vx;
          ball.y += ball.vy;
          ball.spin += ball.vx * 3;
          place(ball);
          // Off the court in any direction (it may sail over the page), or
          // simply in the air long enough: go there.
          const gone =
            ball.y < -height || ball.y > height * 2.5 || ball.x < -width * 0.3 || ball.x > width * 1.3;
          if (gone || ball.age > 70) {
            goTo(ball.shot, fromGesture);
            ball.el.style.opacity = "0";
            const b = ball;
            window.setTimeout(() => {
              b.el.style.opacity = "";
              respawn(b);
            }, 900);
            ball.flying = false;
            ball.age = -1; // parked until respawn
          }
          continue;
        }
        if (!inside || ball.age === -1) continue;

        const dx = ball.x - px;
        const dy = ball.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist >= BALL_R + PADDLE_R) continue;

        const speed = Math.hypot(pvx, pvy);
        if (speed > HIT_SPEED) {
          // Send it the way the paddle was moving, always with some lift.
          launch(balls.indexOf(ball), pvx * 1.5, Math.min(pvy * 1.5, -14));
        } else {
          // Gentle contact: push it just clear of the paddle.
          const push = (BALL_R + PADDLE_R - dist) / Math.max(dist, 1);
          ball.x += dx * push;
          ball.y += dy * push;
          ball.x = Math.max(BALL_R, Math.min(width - BALL_R, ball.x));
          ball.y = Math.max(BALL_R, Math.min(height - BALL_R, ball.y));
          ball.spin += dx * push * 4;
          place(ball);
        }
      }

      if (busy) {
        frame = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };

    const resize = new ResizeObserver(() => {
      width = court.clientWidth;
      height = court.clientHeight;
      balls.forEach((ball, i) => {
        [ball.homeX, ball.homeY] = homeFor(i, balls.length, width);
      });
      for (const ball of balls) {
        if (!ball.flying) {
          ball.x = ball.homeX * width;
          ball.y = ball.homeY * height;
          place(ball);
        }
      }
    });
    resize.observe(court);
    balls.forEach(place);

    court.addEventListener("pointermove", onMove);
    court.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      court.removeEventListener("pointermove", onMove);
      court.removeEventListener("pointerleave", onLeave);
    };
  }, [shots]);

  return (
    <section id="play" aria-labelledby="shot-heading" className="scroll-mt-24 px-4 pb-6 pt-24 sm:px-6 md:pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h2 id="shot-heading" data-reveal className="font-display text-3xl font-bold tracking-tight md:text-5xl">
            Pick your <span className="font-serif font-normal italic tracking-normal text-lime">shot</span>
          </h2>
          <p data-reveal="0.1" className="max-w-xs text-mist/70">
            <span className="hidden md:inline">Swing the paddle through a ball.</span>
            <span className="md:hidden">Tap a ball.</span> Wherever it&apos;s headed, you&apos;re going too.
          </p>
        </div>

        <div data-reveal="0.15" className="relative mt-14">
        {/* The umpire: sits behind the court (earlier in the DOM, court on
            top) so only its head and shoulders peek over the baseline. */}
        <div className="pointer-events-none absolute -top-[4.6rem] right-8 w-24 md:right-16" aria-hidden="true">
          <div ref={umpireRef}>
            <Penguin pose="wave" outfit={theme.outfit} className="w-full" />
          </div>
        </div>
        <p
          ref={toastRef}
          data-show="false"
          aria-live="polite"
          className="pointer-events-none absolute -top-16 right-36 z-30 origin-bottom-right scale-90 rounded-2xl rounded-br-sm bg-cream px-4 py-2 font-display text-sm font-bold text-night opacity-0 shadow-xl shadow-night/40 transition-all duration-300 data-[show=true]:scale-100 data-[show=true]:opacity-100 md:right-44"
        />

        {/* Festival trim along the baseline (the umpire stands knee-deep in snow). */}
        <EdgeDecor edge={theme.edge} seed={7} colors={theme.bunting} />

        <div
          ref={courtRef}
          data-cursor-hide
          className="relative z-[1] h-72 touch-pan-y rounded-4xl border border-white/10 bg-gradient-to-b from-court to-plum md:h-96 md:cursor-none"
        >
          {/* Court markings: outline, centre line, and the net across the middle. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-4xl" aria-hidden="true">
            <div className="absolute inset-5 rounded-2xl border-2 border-white/25" />
            <div className="absolute inset-y-5 left-1/2 w-0.5 -translate-x-1/2 bg-white/20" />
            <div className="absolute inset-x-5 top-[30%] h-0.5 bg-white/20" />
            <div className="absolute inset-x-5 bottom-[30%] h-0.5 bg-white/20" />
            <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.35)_0_2px,transparent_2px_10px)]" />
          </div>

          {shots.map((shot, index) => (
            <button
              key={shot.href + shot.label}
              type="button"
              data-ball
              aria-label={`Go to ${shot.label}`}
              onClick={() => launchRef.current(index)}
              className="absolute left-0 top-0 z-10 size-14 rounded-full will-change-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime"
            >
              <PickleballSvg />
              <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-night/70 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-cream backdrop-blur-sm">
                {shot.label}
              </span>
            </button>
          ))}

          <div
            ref={paddleRef}
            data-show="false"
            className="pointer-events-none absolute left-0 top-0 z-20 size-0 origin-top-left opacity-0 transition-opacity duration-200 data-[show=true]:opacity-100"
            aria-hidden="true"
          >
            <PaddleSvg />
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

/** A lime pickleball with its holes, in the brand palette. */
function PickleballSvg() {
  const holes = [
    [30, 16], [44, 26], [46, 42], [32, 46], [18, 38], [16, 22], [30, 31],
  ];
  return (
    <svg viewBox="0 0 60 60" className="size-full origin-center drop-shadow-[0_8px_14px_rgb(13_8_32/0.5)]" aria-hidden="true">
      <defs>
        <radialGradient id="ball-shade" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#f1ffb0" />
          <stop offset="55%" stopColor="#d8f65a" />
          <stop offset="100%" stopColor="#9fbf1e" />
        </radialGradient>
      </defs>
      <circle cx="30" cy="30" r="28" fill="url(#ball-shade)" />
      {holes.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.6" fill="#7f9a12" opacity="0.75" />
      ))}
    </svg>
  );
}

/**
 * The paddle. Its wrapper is a zero-size point at the pointer that rotates
 * about itself; the SVG hangs off it so the face is centred on that point,
 * with the handle trailing below.
 */
function PaddleSvg() {
  return (
    <svg
      viewBox="0 0 100 170"
      className="absolute -left-[50px] -top-[54px] w-[100px] max-w-none drop-shadow-[0_16px_24px_rgb(13_8_32/0.55)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="paddle-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8f74e6" />
          <stop offset="100%" stopColor="#4b2f9e" />
        </linearGradient>
      </defs>
      {/* handle */}
      <rect x="40" y="96" width="20" height="70" rx="8" fill="#17102e" />
      <path d="M42 110h16M42 122h16M42 134h16M42 146h16" stroke="#3a2b66" strokeWidth="3" />
      {/* face with edge guard */}
      <rect x="6" y="4" width="88" height="100" rx="40" fill="url(#paddle-face)" stroke="#d8f65a" strokeWidth="4" />
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontSize="24"
        fontWeight="800"
        fill="#f7f4ff"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}
      >
        sync
      </text>
    </svg>
  );
}
