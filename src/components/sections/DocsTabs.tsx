"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export type DocTab = { id: string; label: string; raw: string; html: string };

const LOG: { text: string; tone?: "ok" | "num" | "dim" }[] = [
  { text: "kestrel 4.12.0", tone: "dim" },
  { text: "bundled 38 files · 1.2 MB in 412 ms", tone: "ok" },
  { text: "uploaded to 284 locations", tone: "ok" },
  { text: "warmed cache shards 96/96", tone: "ok" },
  { text: "live → https://my-store.kestrel.app", tone: "num" },
  { text: "deployed in 2.1 s", tone: "ok" },
];

const tone = { ok: "text-lime", num: "text-sky", dim: "text-muted" } as const;

export function DocsTabs({ tabs }: { tabs: DocTab[] }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [played, setPlayed] = useState(0);
  const [copied, setCopied] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // Replay the deploy log whenever the tab changes.
  useEffect(() => {
    if (reduced) return;
    const timers = [window.setTimeout(() => setPlayed(0), 0), ...LOG.map((_, i) => window.setTimeout(() => setPlayed(i + 1), 350 + i * 330))];
    return () => timers.forEach(window.clearTimeout);
  }, [active, reduced]);
  const lines = reduced ? LOG.length : played;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tabs[active].raw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be blocked; the code stays selectable.
    }
  };

  const onKey = (e: KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (active + d + tabs.length) % tabs.length;
    setActive(n);
    refs.current[n]?.focus();
  };

  return (
    <div className="border border-line bg-panel/60">
      <div className="flex items-center justify-between border-b border-line pr-2">
        <div role="tablist" aria-label="Language" onKeyDown={onKey} className="flex">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              id={`doc-tab-${t.id}`}
              aria-selected={i === active}
              aria-controls="doc-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={`t-label relative min-h-[44px] px-4 transition-colors duration-300 md:px-5 ${i === active ? "text-ink" : "text-muted hover:text-ink"}`}
            >
              {t.label}
              {i === active && <motion.span layoutId="doc-underline" className="absolute inset-x-3 bottom-0 h-px bg-sky" />}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copy}
          data-cursor="copy"
          className="t-label min-h-[44px] min-w-[72px] px-3 text-muted transition-colors duration-300 hover:text-sky"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>

      <div id="doc-panel" role="tabpanel" aria-labelledby={`doc-tab-${tabs[active].id}`} tabIndex={0} className="overflow-x-auto px-4 py-5 md:px-6">
        <div className="docs-code t-mono text-[12.5px] leading-[1.7] md:text-[13px]" dangerouslySetInnerHTML={{ __html: tabs[active].html }} />
      </div>

      <div className="border-t border-line px-4 py-4 md:px-6" aria-label="Example deploy output">
        <p className="t-label mb-3 flex items-center justify-between text-muted">
          <span>$ npx kestrel deploy</span>
          <span>{lines >= LOG.length ? "done" : "running"}</span>
        </p>
        <ol className="t-mono min-h-[9.5em] space-y-0.5 text-[12px]">
          <AnimatePresence initial={false}>
            {LOG.slice(0, lines).map((l, i) => (
              <motion.li key={`${active}-${i}`} initial={reduced ? false : { opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className={tone[l.tone ?? "dim"]}>
                <span className="mr-2 text-muted">{i === LOG.length - 1 ? "✓" : "›"}</span>
                {l.text}
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </div>
    </div>
  );
}
