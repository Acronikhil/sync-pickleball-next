"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export const TOUR_DONE_KEY = "sync-admin-tour-done";

const STEPS = [
  { target: "rail", title: "Pick what to edit", body: "Everything on the site is grouped here. Click an area to open it." },
  { target: "panel", title: "Make your changes", body: "Edit text, swap photos and switch things on or off. Nothing goes live yet." },
  { target: "preview", title: "See it like a visitor", body: "The preview updates as you type. Switch between desktop and phone above it." },
  { target: "status", title: "Your work is kept safe", body: "Edits stay in this browser until you publish, so you can close the tab and come back later." },
  { target: "publish", title: "Publish when you are ready", body: "This puts your changes on the live site. They show up in about a minute." },
  { target: "help", title: "Help is always here", body: "Open the guide for step by step help, or replay this tour any time." },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * A short guided tour: dims the screen, spotlights one part of the editor
 * at a time (anything marked `data-tour="<target>"`) and explains it. Steps
 * whose target isn't visible, like the preview on a phone, are skipped.
 */
export function AdminTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const visibleSteps = useCallback(
    () =>
      STEPS.filter((step) => {
        const el = document.querySelector(`[data-tour="${step.target}"]`);
        const box = el?.getBoundingClientRect();
        return box && box.width > 0 && box.height > 0;
      }),
    []
  );

  const [steps, setSteps] = useState(STEPS);

  useEffect(() => {
    if (open) {
      setSteps(visibleSteps());
      setIndex(0);
    }
  }, [open, visibleSteps]);

  const step = steps[index];

  const measure = useCallback(() => {
    if (!step) return;
    const box = document.querySelector(`[data-tour="${step.target}"]`)?.getBoundingClientRect();
    setRect(box ? { top: box.top, left: box.left, width: box.width, height: box.height } : null);
  }, [step]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(TOUR_DONE_KEY, "1");
    } catch {}
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, steps.length - 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, finish, steps.length]);

  if (!open || !step) return null;

  const pad = 8;
  const last = index === steps.length - 1;
  // Put the card below the spotlight if there's room, otherwise above it.
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
  const cardWidth = Math.min(340, vw - 32);
  let cardTop = vh / 2 - 90;
  let cardLeft = vw / 2 - cardWidth / 2;
  if (rect) {
    const tall = rect.height > vh * 0.5;
    const roomRight = vw - (rect.left + rect.width) > cardWidth + 32;
    const roomLeft = rect.left > cardWidth + 32;
    if (tall && (roomRight || roomLeft)) {
      // Tall areas (the menu, the preview): sit beside them, near the top.
      cardLeft = roomRight ? rect.left + rect.width + pad + 16 : rect.left - pad - 16 - cardWidth;
      cardTop = Math.max(16, rect.top + 24);
    } else {
      const below = rect.top + rect.height + 200 < vh;
      cardTop = below ? rect.top + rect.height + pad + 12 : Math.max(16, rect.top - pad - 12 - 190);
      cardLeft = Math.min(Math.max(16, rect.left), vw - cardWidth - 16);
    }
  }

  return (
    <div className="a-tour" role="dialog" aria-modal="true" aria-label="Editor tour">
      {rect && (
        <div
          className="a-tour-spot"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        />
      )}
      <div className="a-tour-card" style={{ top: cardTop, left: cardLeft, width: cardWidth }}>
        <p className="a-tour-count">
          {index + 1} of {steps.length}
        </p>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="a-tour-actions">
          <button type="button" className="a-btn a-btn-quiet a-btn-sm" onClick={finish}>
            Skip
          </button>
          <span className="a-spacer" />
          {index > 0 && (
            <button type="button" className="a-btn a-btn-quiet a-btn-sm" onClick={() => setIndex(index - 1)}>
              Back
            </button>
          )}
          <button
            type="button"
            className="a-btn a-btn-primary a-btn-sm"
            onClick={() => (last ? finish() : setIndex(index + 1))}
            autoFocus
          >
            {last ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
