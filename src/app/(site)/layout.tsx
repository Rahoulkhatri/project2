import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { PageScroll } from "@/components/site/PageScroll";
import { Cursor } from "@/components/ui/Cursor";
import { Footer } from "@/components/sections/Footer";

/** Shared frame for the inner pages: header, smooth scroll, cursor, footer. The home story has its own shell. */
export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <PageScroll />
      <main id="main" tabIndex={-1} className="relative outline-none">
        {children}
      </main>
      <div className="relative bg-bg">
        <Footer />
      </div>
      <div aria-hidden className="grain" />
      <Cursor />
    </>
  );
}
