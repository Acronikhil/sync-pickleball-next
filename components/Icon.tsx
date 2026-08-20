import type { IconName } from "@/lib/content";

/**
 * Icons come from the Bootstrap Icons and Font Awesome CDN fonts already
 * loaded in the layout. They render in `currentColor` rather than a hardcoded
 * shade, so the surrounding Tailwind classes (button text color, footer link
 * color, ...) decide the icon's color — one less place colors can drift out
 * of sync with the funky palette.
 */
export function ButtonIcon({ name }: { name: IconName; primary?: boolean }) {
  switch (name) {
    case "arrow-right":
      return (
        <i
          className="bi bi-arrow-right-short text-2xl leading-none text-current transition-transform duration-300 ease-out group-hover:translate-x-1"
          aria-hidden="true"
        />
      );
    case "arrow-down":
      return (
        <i
          className="bi bi-arrow-down-short text-2xl leading-none text-current transition-transform duration-300 ease-out group-hover:translate-y-1"
          aria-hidden="true"
        />
      );
    case "instagram":
      return (
        <i
          className="fa-brands fa-instagram text-current text-[1.35rem] leading-none"
          aria-hidden="true"
        />
      );
    case "phone":
      return <i className="fa fa-solid fa-phone text-current" aria-hidden="true" />;
    case "envelope":
      return <i className="fa fa-solid fa-envelope text-current" aria-hidden="true" />;
    case "location":
      return <i className="fa fa-solid fa-location-dot text-current" aria-hidden="true" />;
    case "none":
    default:
      return null;
  }
}

/** The footer contact row uses the same currentColor treatment. */
export function SocialIcon({ name }: { name: IconName }) {
  switch (name) {
    case "instagram":
      return (
        <i className="fa fa-brands fa-instagram text-current" aria-hidden="true" />
      );
    case "phone":
      return <i className="fa fa-solid fa-phone text-current" aria-hidden="true" />;
    case "envelope":
      return <i className="fa fa-solid fa-envelope text-current" aria-hidden="true" />;
    case "location":
      return <i className="fa fa-solid fa-location-dot text-current" aria-hidden="true" />;
    default:
      return <i className="fa fa-solid fa-link text-current" aria-hidden="true" />;
  }
}
