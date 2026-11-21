"use client";

import { useEffect, useState } from "react";
import type { Button, ImageRef } from "@/lib/content";
import { Icon } from "./Icon";

export interface NavLink {
  href: string;
  label: string;
}

/**
 * Floating pill nav. Transparent over the hero photo, then condenses into a
 * frosted bar once the page scrolls. On small screens the links fold into a
 * full-screen sheet.
 */
export function SiteNav({
  logo,
  links,
  book,
}: {
  logo: ImageRef;
  links: NavLink[];
  book?: Button;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      // Highlight the link for whichever section sits under the nav bar.
      let current = "";
      for (const link of links) {
        const target = document.querySelector(link.href);
        if (target && target.getBoundingClientRect().top <= window.innerHeight * 0.35) {
          current = link.href;
        }
      }
      setActive(current);
    };
    // Only the public page scrolls the window; in the admin preview the nav
    // just keeps its resting look.
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [links]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const bookProps = book?.href
    ? {
        href: book.href,
        ...(book.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {}),
      }
    : {};

  return (
    // Sticky with zero height rather than fixed: it still overlays the hero,
    // but stays inside the admin's preview pane instead of escaping it.
    <header className="pointer-events-none sticky top-0 z-50 h-0">
      {/* Padding lives on this inner wrapper so the header itself stays 0px tall. */}
      <div className="px-4 pt-4 sm:px-6">
      <nav
        aria-label="Main"
        // Always frosted, so the links stay legible over the hero photo;
        // a touch more solid once the page scrolls.
        className={`pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border py-2 pl-2 pr-2 shadow-2xl shadow-black/30 backdrop-blur-xl transition-all duration-500 ${
          scrolled || open ? "border-white/12 bg-ink/85" : "border-white/10 bg-night/55"
        }`}
      >
        <a href="#top" className="flex items-center gap-3" aria-label="Sync Pickleball, back to top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo.src} alt={logo.alt} className="size-11 rounded-full" />
          <span className="hidden font-display text-lg font-bold tracking-tight sm:block">
            Sync<span className="text-lilac">.</span>
          </span>
        </a>

        <ul className="hidden items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] p-1 md:flex">
          {links.map((link) => {
            const current = active === link.href;
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={current ? "true" : undefined}
                  className={`flex min-h-10 items-center gap-2 rounded-full px-4 text-[0.92rem] font-semibold tracking-tight transition-colors duration-200 hover:bg-lime hover:text-night ${
                    current ? "bg-white/12 text-lime" : "text-cream"
                  }`}
                >
                  {current && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          {book && (
            <a
              {...bookProps}
              className="rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-night transition-transform hover:-translate-y-0.5"
            >
              {book.label}
            </a>
          )}
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/5 text-xl text-cream md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        className={`pointer-events-auto mx-auto mt-2 max-w-6xl overflow-hidden rounded-4xl border border-white/10 bg-ink/90 backdrop-blur-xl transition-all duration-500 md:hidden ${
          open ? "max-h-96 opacity-100" : "pointer-events-none max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col p-3">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                className="flex items-center justify-between rounded-2xl px-5 py-4 font-display text-2xl font-semibold tracking-tight hover:bg-white/5"
              >
                {link.label}
                <Icon name="arrow-right" className="size-5 text-lilac" />
              </a>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </header>
  );
}
