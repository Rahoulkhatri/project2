"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { NAV } from "@/lib/nav";

/** Hamburger and full-screen menu for phones. Shared by the home HUD and the page header. */
export function NavMenu({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Close on navigation. Deferred so it is not a synchronous state update inside the effect.
    const id = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="pointer-events-auto relative z-[70] grid h-11 w-11 place-items-center border border-line-strong bg-bg/40 backdrop-blur-sm"
      >
        <span className="relative block h-[10px] w-5">
          <span className={`absolute left-0 h-px w-5 bg-ink transition-all duration-300 ${open ? "top-[5px] rotate-45" : "top-0"}`} />
          <span className={`absolute left-0 h-px w-5 bg-ink transition-all duration-300 ${open ? "top-[5px] -rotate-45" : "top-[10px]"}`} />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto fixed inset-0 z-[65] flex flex-col justify-center bg-bg/95 px-[var(--gutter)]"
          >
            <ul>
              {[...NAV, { href: "/contact", label: "Contact" }].map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="border-t border-line last:border-b"
                >
                  <Link href={l.href} className="flex min-h-[64px] items-baseline gap-4 py-3">
                    <span className="t-mono w-8 text-[12px] text-sky">{String(i + 1).padStart(2, "0")}</span>
                    <span className={`t-display text-[clamp(2rem,9vw,3rem)] ${pathname === l.href ? "text-sky" : "text-ink"}`}>{l.label}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <Link href="/" className="t-label mt-8 text-muted">
              ← The story
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
