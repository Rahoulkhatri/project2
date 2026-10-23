"use client";

import { useEffect, useRef } from "react";
import { useStory } from "@/lib/store";
import { toLocal } from "@/lib/story";

const SQL = "SELECT * FROM products\n  WHERE active = true\n  ORDER BY rank\n  LIMIT 48;";

/** Live-typed query panel; typing is scrubbed by scroll, results land at the end of the scan. */
export function QueryPanel() {
  const code = useRef<HTMLPreElement>(null);
  const result = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      useStory.subscribe(
        (s) => s.progress,
        (p) => {
          const s = toLocal("database", p);
          const n = Math.round(Math.min(1, Math.max(0, (s - 0.1) / 0.3)) * SQL.length);
          if (code.current) code.current.textContent = SQL.slice(0, n);
          if (result.current) result.current.style.opacity = s > 0.58 ? "1" : "0";
        },
        { fireImmediately: true },
      ),
    [],
  );

  return (
    <div data-fade className="t-mono w-[min(88vw,420px)] border border-line bg-panel/80 text-[12px] backdrop-blur-md">
      <div className="t-label flex justify-between border-b border-line px-4 py-2 text-muted">
        <span>psql · pg-khi-02</span>
        <span>read replica</span>
      </div>
      <div className="px-4 py-4 leading-relaxed">
        <div className="text-muted">
          <span className="text-sky">products=&gt;</span>
        </div>
        <pre ref={code} className="min-h-[5.2em] whitespace-pre-wrap text-ink" />
        <div ref={result} className="mt-3 border-t border-line pt-3 text-muted transition-opacity duration-500" style={{ opacity: 0 }}>
          <div className="text-lime">48 rows · 6.1 ms</div>
          <div>Index Scan using products_pkey</div>
        </div>
      </div>
    </div>
  );
}
