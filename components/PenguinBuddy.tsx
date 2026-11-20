"use client";

import { useEffect, useState } from "react";
import type { Button } from "@/lib/content";
import { Icon } from "./Icon";
import { Penguin } from "./Penguin";
import { SnowCap } from "./SnowCap";

const DISMISS_KEY = "sync-penguin-dismissed";

/**
 * The penguin pops up from the bottom-right corner once you've scrolled past
 * the header, says hello once, and from then on offers a quick way to book
 * when tapped. It ducks out of the way at the footer (which has its own
 * penguin), and stays gone for the session if closed.
 *
 * Public page only: mounted from app/page.tsx, never in the admin preview,
 * where a fixed element would float over the editor.
 */
export function PenguinBuddy({ book, snowy = false }: { book?: Button; snowy?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [greeted, setGreeted] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }

    const footer = document.querySelector("#visit");
    const court = document.querySelector("#play [data-cursor-hide]");
    const onScroll = () => {
      const vh = window.innerHeight;
      const pastHero = window.scrollY > vh * 0.8;
      const atFooter = footer ? footer.getBoundingClientRect().top < vh * 0.85 : false;
      // The court has its own umpire penguin; don't show two at once.
      const courtBox = court?.getBoundingClientRect();
      const atCourt = courtBox ? courtBox.top < vh && courtBox.bottom > 0 : false;
      setVisible(pastHero && !atFooter && !atCourt);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Say hello once, the first time it appears — on wider screens only; on a
  // phone the bubble would cover what you're reading, so it waits for a tap.
  useEffect(() => {
    if (!visible || greeted) return;
    setGreeted(true);
    if (window.matchMedia("(min-width: 768px)").matches) setOpen(true);
  }, [visible, greeted]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setOpen(false), 6000);
    return () => window.clearTimeout(t);
  }, [open]);

  // Tuck the bubble away whenever the penguin hides.
  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  if (dismissed || !book?.href) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <div
      className={`fixed bottom-0 right-3 z-40 flex items-end gap-2 transition-transform duration-500 ease-[cubic-bezier(.2,.9,.3,1.3)] md:right-6 ${
        visible ? "translate-y-0" : "translate-y-[110%]"
      }`}
    >
      <div
        role="status"
        className={`mb-16 max-w-64 origin-bottom-right rounded-2xl font-sans rounded-br-sm bg-cream p-4 text-night shadow-2xl shadow-night/50 transition-all duration-300 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"
        }`}
      >
        <p className="font-display text-base font-bold leading-tight">Hey! Courts fill up fast.</p>
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
        aria-label={open ? "Close the penguin's message" : "Ask the Sync penguin"}
        className="group relative -mb-3 w-20 shrink-0 cursor-pointer border-0 bg-transparent p-0 md:w-24"
      >
        {snowy && <SnowCap seed={9} shape="mound" className="absolute -inset-x-4 bottom-0 z-10 h-7" />}
        <Penguin
          pose={open ? "cheer" : "wave"}
          className="w-full drop-shadow-[0_10px_20px_rgb(13_8_32/0.6)] transition-transform duration-300 group-hover:-translate-y-1"
        />
      </button>
    </div>
  );
}
