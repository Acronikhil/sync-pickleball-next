"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * The blurred pickleball that trails the cursor (ported from the old index.js).
 * Skipped on touch devices, where there is no cursor to follow and the ticker
 * would just burn battery.
 */
export function PickleballCursor({ image }: { image: string }) {
  const ballRef = useRef<HTMLImageElement>(null);
  const shadowRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const ball = ballRef.current;
    const shadow = shadowRef.current;
    if (!ball || !shadow) return;

    if (window.matchMedia("(pointer: coarse)").matches) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let angle = 0;

    const onMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const tick = () => {
      angle += 5;

      gsap.to(ball, {
        duration: 0.9,
        x: mouseX,
        y: mouseY,
        rotation: angle,
        scale: 1.2,
        ease: "power1.out",
        overwrite: true,
      });

      // Shadow trails just below the ball and never rotates.
      gsap.to(shadow, {
        duration: 0.9,
        x: mouseX,
        y: mouseY + 2,
        scale: 1.1,
        ease: "power1.out",
        overwrite: true,
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    gsap.ticker.add(tick);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      gsap.ticker.remove(tick);
      gsap.killTweensOf([ball, shadow]);
    };
  }, []);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={ballRef} id="pickleball" src={image} alt="" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={shadowRef}
        id="pickleball-shadow"
        src={image}
        alt=""
        aria-hidden="true"
      />
    </>
  );
}
