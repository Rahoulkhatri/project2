"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { emailSchema } from "@/lib/contact-schema";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Platform",
    links: [
      ["Edge Runtime", "/platform"],
      ["Smart Cache", "/platform"],
      ["Global Routing", "/regions"],
      ["Managed Postgres", "/platform"],
    ],
  },
  {
    title: "Developers",
    links: [
      ["Documentation", "/docs"],
      ["API reference", "/docs"],
      ["Changelog", "#"],
      ["System status", "#"],
    ],
  },
  {
    title: "Company",
    links: [
      ["Talk to us", "/contact"],
      ["About us", "/company"],
      ["Pricing", "/pricing"],
      ["Privacy", "#"],
    ],
  },
];

function KarachiClock() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const tick = () => setT(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="t-mono tabular-nums" suppressHydrationWarning>
      {t ?? "--:--:--"} PKT
    </span>
  );
}

function Newsletter() {
  const [value, setValue] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "error" | "ok"; msg?: string }>({ kind: "idle" });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = emailSchema.safeParse(value);
    if (!r.success) return setState({ kind: "error", msg: r.error.issues[0].message });
    setState({ kind: "ok", msg: "Subscribed. One email a month, with numbers." });
    setValue("");
  };

  return (
    <form onSubmit={submit} noValidate aria-label="Newsletter">
      <label htmlFor="nl-email" className="t-label block text-muted">
        Field notes, monthly
      </label>
      <div className="mt-2 flex border-b border-line-strong transition-colors duration-300 focus-within:border-sky">
        <input
          id="nl-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (state.kind !== "idle") setState({ kind: "idle" });
          }}
          placeholder="you@company.com"
          aria-invalid={state.kind === "error"}
          aria-describedby="nl-msg"
          className="min-h-[48px] w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted/60"
        />
        <button type="submit" className="t-label min-h-[48px] px-3 text-ink transition-colors duration-300 hover:text-sky">
          Join
        </button>
      </div>
      <p id="nl-msg" role="status" className="t-label mt-2 min-h-[1.4em]" style={{ color: state.kind === "error" ? "var(--hot)" : "var(--lime)" }}>
        {state.msg}
      </p>
    </form>
  );
}

export function Footer() {
  return (
    <footer id="status" className="relative overflow-hidden border-t border-line px-[var(--gutter)] pt-16">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <Newsletter />
          <p className="t-label mt-8 flex items-center gap-2 text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            All systems normal · 284/284 locations
          </p>
          <p className="t-label mt-3 text-muted">
            Karachi · <KarachiClock />
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7 md:col-start-6">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h2 className="t-label text-muted">{c.title}</h2>
              <ul className="mt-4 space-y-1">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="inline-flex min-h-[44px] items-center text-[15px] text-ink transition-colors duration-300 hover:text-sky">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <p className="t-label mt-16 flex flex-wrap justify-between gap-3 text-muted">
        <span>© 2026 Kestrel Cloud, Inc.</span>
        <span>Built in Karachi, run everywhere</span>
      </p>

      {/* Wordmark, cropped at the bottom edge, filled with the packet-blue gradient. */}
      <div aria-hidden className="mt-6 h-[17.5vw] overflow-hidden">
        <p
          className="t-display select-none whitespace-nowrap text-center text-[27vw] leading-[0.74] tracking-[-0.05em]"
          style={{
            background: "linear-gradient(180deg, #7DD3FC 0%, #38BDF8 28%, #0C4A6E 70%, rgba(4,6,10,0) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          KESTREL
        </p>
      </div>
    </footer>
  );
}
