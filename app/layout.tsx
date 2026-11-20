import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/site.config";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
  title: "Sync Pickleball – Premium Pickleball Club & Café in Indore",
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
    title: "Sync Pickleball – Club & Café, Indore",
    description:
      "Pro-grade courts, a cutesy café and a buzzing community. Book your slot today!",
    images: ["/assets/venue/courts-night.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0820",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: "Sync Pickleball",
  url: `${siteConfig.site.url}/`,
  logo: `${siteConfig.site.url}/assets/logo.png`,
};

/** Runs before paint so scroll-reveal elements never flash. See globals.css. */
const motionFlag = `if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("js")`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${inter.variable} ${instrument.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionFlag }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
