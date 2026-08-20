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
      <div className="flex justify-center gap-4 pb-4">
        {socials.map((social) => {
          const external = social.href.startsWith("http");
          return (
            <a
              key={social.id}
              href={social.href}
              aria-label={social.label}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg text-white/70 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-110 hover:border-funky-cyan hover:text-funky-cyan hover:shadow-lg hover:shadow-funky-cyan/20"
            >
              <SocialIcon name={social.icon} />
            </a>
          );
        })}
      </div>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-white/60">
        <p className="text-[11px]">{footer.copyright}</p>
        <p className="mt-1 text-sm">
          {footer.creditPrefix}{" "}
          <i
            className="fas fa-heart animate-heartbeat text-funky-pink/70"
            aria-hidden="true"
          />{" "}
          by{" "}
          <a
            href={footer.creditHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 underline decoration-white/20 underline-offset-2 transition-colors hover:text-funky-pink"
          >
            {footer.creditName}
          </a>
        </p>
      </footer>
    </>
  );
}
