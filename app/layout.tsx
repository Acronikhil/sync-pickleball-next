import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans, Unbounded } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/site.config";
import { siteContent } from "@/lib/site-content";

// Headings: Unbounded — round, geometric and sporty, in step with the
// rounded letters of the Sync logo.
const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  display: "swap",
});

// Body and UI: Plus Jakarta Sans — crisp at small sizes on dark backgrounds.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.site.url),
  title: "Sync Pickleball | Premium Pickleball Club & Café in Indore",
  description:
    "Join Sync Pickleball, Indore’s first premium pickleball club and café. Play on pro-grade courts, enjoy great food & drinks, and be part of our vibrant pickleball community. Book your slot today!",
  keywords: [
    "pickleball club Indore",
    "premium pickleball courts",
    "pickleball cafe",
    "indoor pickleball club",
    "pickleball community",
    "play pickleball",
    "pickleball gear",
  ],
  // Off by default on this subdomain — see siteConfig.site.allowIndexing.
  robots: siteConfig.site.allowIndexing
    ? { index: true, follow: true }
    : { index: false, follow: false },
  icons: { icon: "/assets/favicon_io_sync/favicon_2.ico" },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Sync Pickleball | Club & Café, Indore",
    description:
      "Pro-grade courts, a cutesy café and a buzzing community. Book your slot today!",
    images: ["/assets/venue/courts-night.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sync Pickleball | Club & Café, Indore",
    images: ["/assets/venue/courts-night.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0820",
};

/**
 * Business details for search engines (rich results, Maps panel). Contact
 * fields come from the footer's contact links, so editing those in /admin
 * keeps this in step.
 */
function organizationSchema() {
  const href = (icon: string) =>
    siteContent.socials.find((s) => s.icon === icon)?.href ?? "";
  const phone = href("phone").replace(/^tel:/, "");
  const email = href("envelope").replace(/^mailto:/, "");
  const instagram = href("instagram").split("?")[0];
  const map = href("location");
  const photo = siteContent.hero.background?.src;

  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: "Sync Pickleball Club & Café",
    description: siteContent.hero.body,
    url: `${siteConfig.site.url}/`,
    logo: `${siteConfig.site.url}/assets/logo.png`,
    ...(photo ? { image: `${siteConfig.site.url}${photo}` } : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    ...(map ? { hasMap: map } : {}),
    ...(instagram ? { sameAs: [instagram] } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Indore",
      addressRegion: "Madhya Pradesh",
      addressCountry: "IN",
    },
    sport: "Pickleball",
  };
}

/** Runs before paint so scroll-reveal elements never flash. See globals.css. */
const motionFlag = `if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("js")`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${unbounded.variable} ${jakarta.variable} ${instrument.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionFlag }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema()),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
