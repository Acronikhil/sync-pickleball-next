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

const SHARE_TITLE = "Sync Pickleball Club & Café, Indore";
const SHARE_DESCRIPTION =
  "Indore's first premium pickleball club. Pro-grade courts, a cosy café and a friendly crowd. All levels welcome, book a court today!";
const SHARE_IMAGE = {
  url: "/og/sync-share.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "Sync Pickleball Club & Café in Indore: purple courts at night, with Dinky the penguin",
};

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
  icons: {
    icon: [
      { url: "/assets/favicon_io_sync/favicon_2.ico", sizes: "any" },
      { url: "/assets/favicon_io_sync/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/favicon_io_sync/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/assets/favicon_io_sync/apple-touch-icon.png", sizes: "180x180" },
  },
  alternates: { canonical: "/" },
  applicationName: "Sync Pickleball",
  // What WhatsApp, Instagram, LinkedIn, Facebook and X show when someone
  // shares a link. The card is 1200x630 (the size they all expect) and
  // under 300 KB, which WhatsApp needs before it shows a big preview.
  openGraph: {
    type: "website",
    siteName: "Sync Pickleball",
    locale: "en_IN",
    url: "/",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  formatDetection: { telephone: false },
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
