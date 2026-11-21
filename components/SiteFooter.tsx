import type { FooterContent, ImageRef, SocialLink } from "@/lib/content";
import { FlowText } from "./FlowText";
import { Icon } from "./Icon";
import { Penguin } from "./Penguin";
import { SnowCap } from "./SnowCap";
import { THEMES, type ThemeSpec } from "@/lib/themes";

/**
 * What to print for a contact link. The content only stores the href and an
 * accessible label, so the visible text is derived from the href: the phone
 * number, the email address, the Instagram handle…
 */
function describe(social: SocialLink): { kind: string; value: string } {
  const { href, icon, label } = social;
  if (href.startsWith("tel:")) {
    return { kind: "Call us", value: href.slice(4).replace(/^\+91/, "+91 ") };
  }
  if (href.startsWith("mailto:")) {
    return { kind: "Write to us", value: href.slice(7) };
  }
  if (icon === "instagram") {
    const handle = href.match(/instagram\.com\/([^/?#]+)/)?.[1];
    return { kind: "Follow along", value: handle ? `@${handle}` : "Instagram" };
  }
  if (icon === "location") {
    return { kind: "Find us", value: "Get directions" };
  }
  return { kind: "Link", value: label };
}

export function SiteFooter({
  socials,
  footer,
  logo,
  theme = THEMES.none,
}: {
  socials: SocialLink[];
  footer: FooterContent;
  logo: ImageRef;
  theme?: ThemeSpec;
}) {
  return (
    <footer id="visit" className="scroll-mt-24 overflow-hidden px-4 pt-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-10 border-t border-white/10 pt-16 lg:flex-row lg:items-end">
          <div data-reveal className="max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo.src} alt={logo.alt} className="size-16 rounded-full" />
            <p className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight">
              Come for a game.{" "}
              <span className="font-serif font-normal italic text-lilac">Stay for the vibe.</span>
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:w-[34rem]">
            {socials.map((social, index) => {
              const external = social.href.startsWith("http");
              const { kind, value } = describe(social);
              return (
                <li key={social.id} data-reveal={index * 0.06}>
                  <a
                    href={social.href}
                    aria-label={social.label}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-lime/40 hover:bg-white/[0.07]"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-court/30 text-lg text-lilac transition-colors group-hover:bg-lime group-hover:text-night">
                      <Icon name={social.icon === "none" ? "link" : social.icon} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs uppercase tracking-[0.18em] text-mist/50">{kind}</span>
                      <span className="block truncate font-medium text-cream">{value}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-3 text-sm text-mist/50 md:flex-row">
          <p>{footer.copyright}</p>
          <p>
            {footer.creditPrefix} <span className="text-coral">♥</span> by{" "}
            <a
              href={footer.creditHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-3 text-cream underline decoration-lilac/50 underline-offset-4 hover:decoration-lime"
            >
              {footer.creditName}
            </a>
          </p>
        </div>
      </div>

      <div className="relative mx-auto mt-24 mb-6 w-full max-w-7xl">
        <FlowText text="sync" strokeWidth={0.8} className="pointer-events-none w-full select-none" />
        {/* The penguin, perched on the "c": the top of the lowercase letters
            sits ~38% down the wordmark at every width, as it scales as one. */}
        <Penguin pose="idle" outfit={theme.outfit} className="absolute right-[7%] top-[38%] w-[13%] -translate-y-[93%]" />
        {theme.mounds && (
          // A little mound on top of the "c", in front of the penguin's feet.
          <SnowCap seed={5} shape="mound" className="absolute right-[4.5%] top-[38%] h-[7%] w-[18%] -translate-y-[78%]" />
        )}
      </div>
    </footer>
  );
}
