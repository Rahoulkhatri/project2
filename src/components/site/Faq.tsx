/** Native disclosure elements: keyboard accessible, no JavaScript. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div>
      {items.map((it) => (
        <details key={it.q} className="group border-t border-line last:border-b">
          <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden">
            <span className="t-display text-[clamp(1.2rem,2vw,1.8rem)] tracking-[-0.02em] text-ink">{it.q}</span>
            <span aria-hidden className="relative block h-3 w-3 shrink-0">
              <span className="absolute left-0 top-1/2 h-px w-3 bg-sky" />
              <span className="absolute left-1/2 top-0 h-3 w-px bg-sky transition-transform duration-300 group-open:scale-y-0" />
            </span>
          </summary>
          <p className="t-body max-w-[62ch] pb-6">{it.a}</p>
        </details>
      ))}
    </div>
  );
}
