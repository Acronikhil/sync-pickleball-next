import type { FooterContent, SocialLink } from "@/lib/content";
import { SocialIcon } from "./Icon";

export function SiteFooter({
  socials,
  footer,
}: {
  socials: SocialLink[];
  footer: FooterContent;
}) {
  return (
    <>
      <div className="d-flex justify-content-center gap-2 mb-xl-5">
        {socials.map((social) => {
          const external = social.href.startsWith("http");
          return (
            <a
              key={social.id}
              href={social.href}
              aria-label={social.label}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <SocialIcon name={social.icon} />
            </a>
          );
        })}
      </div>

      <footer className="py-4 text-white">
        <div className="container d-flex justify-content-center align-items-center flex-column">
          <p style={{ fontSize: 10 }}>{footer.copyright}</p>
          <p style={{ fontSize: 15 }}>
            {footer.creditPrefix}{" "}
            <span className="animate__animated animate__heartBeat">
              <i
                className="fas fa-heart animate__animated animate__heartBeat animate__infinite"
                style={{ color: "rgba(222, 56, 255, 0.233)" }}
                aria-hidden="true"
              />
            </span>{" "}
            by{" "}
            <a href={footer.creditHref} target="_blank" rel="noopener noreferrer">
              {footer.creditName}
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
