import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/PageHero";
import { Features } from "@/components/sections/Features";
import { Cta } from "@/components/site/Cta";

export const metadata: Metadata = {
  title: "Platform",
  description: "Edge runtime, smart cache, global routing, managed Postgres and observability on one platform. One deploy, 284 locations, 38 ms cold starts.",
  alternates: { canonical: "/platform" },
};

const STEPS: [string, string, string][] = [
  ["Upload", "412 ms", "The CLI bundles your build and streams it to the nearest of 284 locations. Only changed files are sent."],
  ["Snapshot", "0.6 s", "Your function is booted once and frozen as a V8 heap snapshot, so every later start is a restore, not a boot."],
  ["Replicate", "0.8 s", "The snapshot and static assets fan out to every location. The pointer flips everywhere at the same moment."],
  ["Serve", "38 ms", "The first request lands on a warm copy. Misses are coalesced into one origin fetch and cached on the way back."],
];

export default function PlatformPage() {
  return (
    <>
      <PageHero
        code="01"
        label="Platform"
        model="stack"
        title={
          <>
            Five layers. <span className="text-muted">One deploy.</span>
          </>
        }
        lead="Runtime, cache, routing, Postgres and tracing are one system, so a request never crosses a vendor boundary. That is where the milliseconds go."
        stats={[
          ["cold start", "38 ms"],
          ["locations", "284"],
          ["hit ratio", "94.1%"],
        ]}
      >
        <Link href="/pricing" className="t-label inline-flex h-11 items-center border border-line-strong px-5 text-ink transition-colors duration-300 hover:border-sky hover:text-sky">
          See pricing
        </Link>
      </PageHero>

      <section aria-labelledby="flow-h" className="relative border-t border-line px-[var(--gutter)] py-[14vh]">
        <p className="t-label flex items-center gap-3 text-muted">
          <span className="text-sky">02</span>
          <span className="h-px w-8 bg-line-strong" />
          <span>What a deploy does</span>
        </p>
        <h2 id="flow-h" className="t-display mt-6 max-w-[15ch] text-[clamp(2.4rem,5.4vw,5.6rem)] text-ink">
          From <span className="text-muted">`kestrel deploy`</span> to live, in two seconds.
        </h2>

        <ol className="mt-14 grid grid-cols-1 gap-0 md:grid-cols-12">
          {STEPS.map(([name, ms, text], i) => (
            <li key={name} className={`border-t border-line py-8 md:col-span-6 md:pr-10 ${i % 2 ? "md:col-start-7 md:-mt-[0px]" : ""} ${i > 1 ? "md:mt-0" : ""}`}>
              <div className="flex items-baseline gap-4">
                <span className="t-mono text-[12px] text-sky">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="t-display text-[clamp(1.8rem,3vw,2.8rem)] text-ink">{name}</h3>
                <span className="t-mono ml-auto text-[13px] text-lime">{ms}</span>
              </div>
              <p className="t-body mt-3 max-w-[48ch]">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <Features />
      <Cta />
    </>
  );
}
