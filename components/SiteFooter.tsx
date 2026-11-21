import type { FooterContent, ImageRef, SocialLink } from "@/lib/content";
import { FlowText } from "./FlowText";
import { Icon } from "./Icon";
import { FooterPenguin } from "./FooterPenguin";
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

/**
 * Who made the site. Fixed here in code on purpose, not in the editable
 * content, so it can't be changed from the editor.
 */
const SITE_CREDIT = { name: "Nikhil Dubey", href: "https://dubeynikhil.in" };

function SiteCredit() {
  return (
    <a
      href={SITE_CREDIT.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3.5 transition-colors duration-300 hover:border-lime/40 hover:bg-white/[0.06]"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-lime text-night">
        {/* A tiny paddle that takes a swing on hover. */}
        <svg viewBox="0 0 24 24" className="size-5 origin-bottom transition-transform duration-300 group-hover:-rotate-[25deg]" aria-hidden="true">
          <rect x="6" y="2" width="12" height="13" rx="5.5" fill="currentColor" />
          <rect x="10.5" y="14" width="3" height="8" rx="1.4" fill="currentColor" />
          <circle cx="20.5" cy="5" r="2" fill="currentColor" className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </svg>
      </span>
      <span className="text-left leading-tight">
        <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-mist/50">
          Designed &amp; built by
        </span>
        <span className="block font-display text-sm font-bold text-cream">{SITE_CREDIT.name}</span>
      </span>
      <Icon
        name="arrow-right"
        className="size-4 -rotate-45 text-lime transition-transform duration-300 group-hover:rotate-0"
      />
    </a>
  );
}

export function SiteFooter({
  socials,
  footer,
  logo,
  theme = THEMES.none,
  mascotName = "Dinky",
}: {
  socials: SocialLink[];
  footer: FooterContent;
  logo: ImageRef;
  theme?: ThemeSpec;
  /** The penguin's name, set in the editor. */
  mascotName?: string;
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
          <SiteCredit />
        </div>
      </div>

      {/* Sized so the wordmark and the penguin on it fit on one screen when
          you reach the bottom, on laptops as well as big monitors. */}
      <div className="relative mx-auto mt-16 mb-8 w-full max-w-[min(56rem,calc((100svh-10rem)*1.5))]">
        <FlowText text="sync" strokeWidth={0.8} className="pointer-events-none w-full select-none" />
        {/* The penguin, perched on the "c": the top of the lowercase letters
            sits ~38% down the wordmark at every width, as it scales as one. */}
        <FooterPenguin
          name={mascotName}
          outfit={theme.outfit}
          className="absolute right-[7%] top-[38%] w-[13%] -translate-y-[93%]"
        />
        {theme.mounds && (
          // A little mound on top of the "c", in front of the penguin's feet.
          <SnowCap seed={5} shape="mound" className="absolute right-[4.5%] top-[38%] h-[7%] w-[18%] -translate-y-[78%]" />
        )}
      </div>
    </footer>
  );
}
