"use client";

import { useEffect, useState } from "react";
import type { Button } from "@/lib/content";
import { Icon } from "./Icon";
import { Penguin } from "./Penguin";
import { SnowCap } from "./SnowCap";
import { THEMES, type ThemeSpec } from "@/lib/themes";

const GREETED_KEY = "sync-penguin-greeted";

/**
 * The penguin lives in the bottom-right corner the whole time you're on the
 * page (its eyes follow your cursor — see PenguinGaze). On wider screens it
 * says hello once per visit; after that, tapping it offers a quick way to
 * book. "Not now" just closes the bubble.
 *
 * Public page only: mounted from app/page.tsx, never in the admin preview,
 * where a fixed element would float over the editor.
 */
export function PenguinBuddy({
  book,
  name = "Dinky",
  theme = THEMES.none,
}: {
  book?: Button;
  /** The penguin's name, set in the editor's Settings. */
  name?: string;
  theme?: ThemeSpec;
}) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Waddle in just after the page settles.
    const show = window.setTimeout(() => setVisible(true), 700);

    // Say hello once per visit, on wider screens only (on a phone the
    // bubble would cover what you're reading, so it waits for a tap). It
    // also waits until the header is scrolled past, so the bubble never
    // sits on top of the header's booking card.
    let greeted = false;
    try {
      greeted = sessionStorage.getItem(GREETED_KEY) === "1";
    } catch {}
    let hello = 0;
    const onScroll = () => {
      if (greeted || window.scrollY < window.innerHeight * 0.8) return;
      greeted = true;
      window.removeEventListener("scroll", onScroll);
      hello = window.setTimeout(() => {
        setOpen(true);
        try {
          sessionStorage.setItem(GREETED_KEY, "1");
        } catch {}
      }, 1500);
    };
    if (!greeted && window.matchMedia("(min-width: 768px)").matches) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hello);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setOpen(false), 6000);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!book?.href) return null;

  const dismiss = () => setOpen(false);

  return (
    <div
      // Click-through: the box is sized for the speech bubble even while it's
      // hidden, and would otherwise block whatever is underneath it.
      className={`pointer-events-none fixed bottom-0 right-0 z-40 flex items-end gap-2 transition-transform duration-500 ease-[cubic-bezier(.2,.9,.3,1.3)] md:right-6 ${
        visible ? "translate-y-0" : "translate-y-[110%]"
      }`}
    >
      <div
        role="status"
        className={`mb-16 max-w-64 origin-bottom-right rounded-2xl font-sans rounded-br-sm bg-cream p-4 text-night shadow-2xl shadow-night/50 transition-all duration-300 ${
          open ? "pointer-events-auto scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
      >
        <p className="font-display text-base font-bold leading-tight">Hi, I&apos;m {name}! Courts fill up fast.</p>
        <p className="mt-1 text-sm text-night/70">Want me to hold one for you?</p>
        <div className="mt-3 flex items-center gap-2">
          <a
            href={book.href}
            {...(book.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="inline-flex items-center gap-2 rounded-full bg-night px-4 py-2 text-sm font-semibold text-lime no-underline"
            tabIndex={open ? 0 : -1}
          >
            Book a court <Icon name="arrow-right" className="size-4" />
          </a>
          <button
            type="button"
            onClick={dismiss}
            className="cursor-pointer rounded-full border-0 bg-transparent px-3 py-2 font-sans text-sm text-night/60 hover:text-night"
            tabIndex={open ? 0 : -1}
          >
            Not now
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? `Close ${name}'s message` : `Say hi to ${name} the penguin`}
        className={`group pointer-events-auto relative -mb-3 w-16 shrink-0 cursor-pointer border-0 bg-transparent p-0 transition-transform duration-500 md:w-24 ${
          // On phones it peeks in from the edge while closed, so it never
          // sits on top of a button.
          open ? "" : "max-md:translate-x-[35%]"
        }`}
      >
        {theme.mounds && <SnowCap seed={9} shape="mound" className="absolute -inset-x-4 bottom-0 z-10 h-7" />}
        <Penguin
          pose={open ? "cheer" : "wave"}
          outfit={theme.outfit}
          className="w-full drop-shadow-[0_10px_20px_rgb(13_8_32/0.6)] transition-transform duration-300 group-hover:-translate-y-1"
        />
      </button>
    </div>
  );
}
