import type { Button } from "@/lib/content";
import { ButtonIcon } from "./Icon";

/**
 * A call-to-action button. An empty `href` renders the inert `role="button"`
 * anchor the original markup used for not-yet-wired links (Explore Cafe etc.),
 * so those keep looking right until the admin gives them a destination.
 */
export function ActionButton({
  button,
  className = "",
  style,
}: {
  button: Button;
  className?: string;
  style?: React.CSSProperties;
}) {
  const isPrimary = button.emphasis === "primary";
  const classes = [
    "btn",
    isPrimary ? "active" : "",
    "btn-outline-secondary",
    "d-flex justify-content-center align-items-center gap-2 px-4 rounded-5",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const external = button.newTab && button.href !== "";

  return (
    <a
      role="button"
      className={classes}
      style={style}
      {...(button.href ? { href: button.href } : {})}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {button.label}
      <ButtonIcon name={button.icon} primary={isPrimary} />
    </a>
  );
}
