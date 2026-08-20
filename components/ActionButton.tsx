"use client";

import type { Button } from "@/lib/content";
import { ButtonIcon } from "./Icon";
import { useMagnetic } from "@/lib/useMagnetic";

const BASE =
  "group relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 " +
  "font-display font-semibold tracking-wide whitespace-nowrap cursor-pointer select-none " +
  "transition-[transform,box-shadow,background-color,border-color,color] duration-300 ease-out";

const PRIMARY =
  "text-white bg-[linear-gradient(100deg,var(--color-funky-pink),var(--color-brand),var(--color-funky-cyan))] " +
  "bg-[length:220%_100%] bg-left shadow-[0_10px_30px_-10px_rgba(255,79,163,0.65)] " +
  "hover:bg-right hover:shadow-[0_14px_40px_-8px_rgba(79,240,216,0.55)] hover:-translate-y-0.5";

const SECONDARY =
  "text-white/90 border-2 border-white/25 bg-white/5 backdrop-blur-sm " +
  "hover:border-funky-cyan hover:text-funky-cyan hover:bg-white/10 hover:-translate-y-0.5";

/**
 * A call-to-action button. An empty `href` renders the inert `role="button"`
 * anchor the original markup used for not-yet-wired links (Explore Cafe etc.),
 * so those keep looking right until the admin gives them a destination.
 *
 * Drifts toward the cursor on hover (see lib/useMagnetic) and nudges its icon
 * on hover via the `group` class Icon.tsx's icons key off of.
 */
export function ActionButton({
  button,
  className = "",
}: {
  button: Button;
  className?: string;
}) {
  const isPrimary = button.emphasis === "primary";
  const ref = useMagnetic<HTMLAnchorElement>(0.25);
  const external = button.newTab && button.href !== "";

  return (
    <a
      ref={ref}
      role="button"
      className={[BASE, isPrimary ? PRIMARY : SECONDARY, className].join(" ")}
      {...(button.href ? { href: button.href } : {})}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {button.label}
      <ButtonIcon name={button.icon} />
    </a>
  );
}
