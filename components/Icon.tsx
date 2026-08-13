import type { IconName } from "@/lib/content";

/**
 * Icons come from the Bootstrap Icons and Font Awesome CDN fonts already loaded
 * in the layout. The class strings match the original markup exactly.
 */
export function ButtonIcon({
  name,
  primary = false,
}: {
  name: IconName;
  primary?: boolean;
}) {
  switch (name) {
    case "arrow-right":
      return (
        <i
          className={`bi bi-arrow-right-short display-6 m-0 p-0${
            primary ? " ai" : ""
          }`}
          aria-hidden="true"
        />
      );
    case "arrow-down":
      return (
        <i className="bi bi-arrow-down-short display-6 m-0 p-0" aria-hidden="true" />
      );
    case "instagram":
      return (
        <i
          className="fa-brands fa-instagram m-0 p-0"
          style={{ fontSize: 25, color: "#5f476b" }}
          aria-hidden="true"
        />
      );
    case "phone":
      return <i className="fa fa-solid fa-phone" aria-hidden="true" />;
    case "envelope":
      return <i className="fa fa-solid fa-envelope" aria-hidden="true" />;
    case "location":
      return <i className="fa fa-solid fa-location-dot" aria-hidden="true" />;
    case "none":
    default:
      return null;
  }
}

/** The footer contact row uses the plain Font Awesome treatment. */
export function SocialIcon({ name }: { name: IconName }) {
  switch (name) {
    case "instagram":
      return <i className="fa fa-brands fa-instagram m-0 p-0" aria-hidden="true" />;
    case "phone":
      return <i className="fa fa-solid fa-phone" aria-hidden="true" />;
    case "envelope":
      return <i className="fa fa-solid fa-envelope" aria-hidden="true" />;
    case "location":
      return <i className="fa fa-solid fa-location-dot" aria-hidden="true" />;
    default:
      return <i className="fa fa-solid fa-link" aria-hidden="true" />;
  }
}
