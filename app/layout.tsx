import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteConfig } from "@/site.config";

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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: "Sync Pickleball",
  url: `${siteConfig.site.url}/`,
  logo: `${siteConfig.site.url}/assets/logo.png`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/*
          UI_enhancement: the layout/animation frameworks (Bootstrap CSS,
          animate.css) are gone — Tailwind (app/globals.css) and GSAP now do
          that job. Icon glyph fonts stay, since components still reference
          their classes (bi bi-*, fa fa-*) and swapping icon sets isn't part
          of this pass. Fredoka is new: a rounder, punchier display face for
          headings, layered onto the fonts the original site already loaded.
        */}
        <link
          href="https://fonts.googleapis.com/css2?display=swap&family=Fredoka:wght@500;600;700&family=Montserrat:ital,wght@0,500;1,500&family=Inter:ital,wght@0,400;0,500;1,400;1,500&family=Open+Sans:ital,wght@0,400;1,400"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.0/css/all.min.css"
        />
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
