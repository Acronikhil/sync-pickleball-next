import type { Button } from "@/lib/content";
import { Icon } from "./Icon";

/**
 * A call-to-action. "primary" is the lime Book Now treatment and everything
 * else is a frosted outline. Corners are squared off rather than fully round,
 * so they read more like court tiles than app pills. An empty `href` renders an inert button-looking
 * anchor, so not-yet-wired links (Explore Cafe etc.) still look right until
 * the admin gives them a destination.
 */
export function ActionButton({
  button,
  className = "",
}: {
  button: Button;
  className?: string;
}) {
  const isPrimary = button.emphasis === "primary";
  const external = button.newTab && button.href !== "";

  const classes = [
    "group inline-flex items-center gap-3 rounded-xl py-2 pl-5 pr-2 text-[0.95rem] font-semibold tracking-tight transition-all duration-300",
    isPrimary
      ? "bg-lime text-night shadow-[0_10px_40px_-10px] shadow-lime/60 hover:-translate-y-0.5 hover:shadow-lime/80"
      : "border border-white/20 bg-white/5 text-cream backdrop-blur-md hover:border-white/40 hover:bg-white/10",
    button.icon === "none" ? "pr-6 py-3.5" : "",
    button.href ? "cursor-pointer" : "cursor-default",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a
      role="button"
      className={classes}
      {...(button.href ? { href: button.href } : {})}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {button.label}
      {button.icon !== "none" && (
        <span
          className={`grid size-10 place-items-center rounded-lg text-lg transition-transform duration-300 ${
            isPrimary ? "bg-night text-lime" : "bg-cream text-night"
          } ${
            // Only the right arrow tilts toward "go"; other icons just pop.
            button.icon === "arrow-right"
              ? "group-hover:-rotate-45"
              : "group-hover:scale-110"
          }`}
        >
          <Icon name={button.icon} />
        </span>
      )}
    </a>
  );
}
