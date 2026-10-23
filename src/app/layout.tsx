import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kestrel.dev";

// Latin subset only, and only the weights/axes the design uses; next/font self-hosts and preloads them.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  axes: ["opsz", "wdth"],
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const TITLE = "Kestrel Cloud — Every request has a journey. We make it short.";
const DESCRIPTION =
  "Kestrel is the edge platform for developers. Deploy once to 284 locations; we route, cache and run every request as close to your users as physics allows. Follow one request, start to finish, in 87 ms.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Kestrel Cloud" },
  description: DESCRIPTION,
  applicationName: "Kestrel Cloud",
  alternates: { canonical: "/" },
  keywords: ["edge platform", "serverless", "CDN", "edge functions", "managed Postgres", "developer cloud"],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Kestrel Cloud",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#04060A",
  colorScheme: "dark",
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kestrel Cloud, Inc.",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description: DESCRIPTION,
    address: { "@type": "PostalAddress", addressLocality: "Karachi", addressCountry: "PK" },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Kestrel",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux, macOS, Windows",
    description: "Edge runtime, smart cache, global routing and managed Postgres on one platform.",
    offers: [
      { "@type": "Offer", name: "Hobby", price: "0", priceCurrency: "USD" },
      { "@type": "Offer", name: "Pro", price: "24", priceCurrency: "USD" },
    ],
  },
];

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // `is-booting` locks scroll until the preloader hands over; the client
    // removes it, hence suppressHydrationWarning.
    <html lang="en" className={`${display.variable} ${mono.variable} is-booting`} suppressHydrationWarning>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
