"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { Magnetic } from "@/components/ui/Magnetic";
import { NavMenu } from "./NavMenu";

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M2 16.5 11 5l9 11.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 16.5 11 10.7l4.5 5.8" stroke="var(--sky)" strokeWidth="1.4" />
      <circle cx="11" cy="16.5" r="1.3" fill="var(--sky)" />
    </svg>
  );
}

/** Header for the inner pages. Same look as the story's HUD bar, but with real links. */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-[var(--hud-h)] items-center justify-between bg-gradient-to-b from-bg/90 to-transparent px-[var(--gutter)]">
      <Link href="/" className="flex min-h-[44px] items-center gap-2.5 text-ink" aria-label="Kestrel Cloud, home">
        <LogoMark />
        <span className="t-display text-[20px] tracking-[-0.02em]">Kestrel</span>
        <span className="t-label hidden text-muted md:inline">/ cloud</span>
      </Link>

      <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
        {NAV.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`t-label relative py-2 transition-colors duration-300 hover:text-ink ${active ? "text-ink" : "text-muted"}`}
            >
              {l.label}
              <span className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-sky transition-transform duration-500 ${active ? "scale-x-100" : "scale-x-0"}`} />
            </Link>
          );
        })}
        <Magnetic>
          <Link href="/contact" className="t-label group flex h-10 items-center gap-2 border border-line-strong bg-bg/40 px-4 text-ink backdrop-blur-sm transition-colors duration-300 hover:border-sky">
            Talk to us
            <span className="block h-px w-3 bg-current transition-all duration-300 group-hover:w-5 group-hover:bg-sky" />
          </Link>
        </Magnetic>
      </nav>

      <NavMenu className="md:hidden" />
    </header>
  );
}
