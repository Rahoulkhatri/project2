import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Regions } from "@/components/sections/Regions";
import { Cta } from "@/components/site/Cta";

export const metadata: Metadata = {
  title: "Regions",
  description: "284 locations in 61 countries. Median time to first byte of 31 ms, and under 20 ms in every featured region.",
  alternates: { canonical: "/regions" },
};

const FACTS: [string, string, string][] = [
  ["284", "locations", "Each one runs the full stack: cache, runtime and routing. There are no thin points of presence."],
  ["61", "countries", "Including the places other clouds skip: Karachi, Lagos, Dhaka, Nairobi and Lima."],
  ["31 ms", "median TTFB", "Measured from real users, not synthetic probes, across the last 24 hours."],
];

export default function RegionsPage() {
  return (
    <>
      <PageHero
        code="01"
        label="Regions"
        model="globe"
        cursor="drag"
        title={
          <>
            Close enough <span className="text-muted">to feel local.</span>
          </>
        }
        lead="Anycast brings every request to the nearest location, and the same location runs your code. Drag the globe: every line is a path back to Karachi."
        stats={[
          ["locations", "284"],
          ["countries", "61"],
          ["p50 ttfb", "31 ms"],
        ]}
      />

      <Regions />

      <section aria-label="Network facts" className="relative border-t border-line px-[var(--gutter)] py-[12vh]">
        <dl className="grid grid-cols-1 gap-y-0 md:grid-cols-3">
          {FACTS.map(([v, k, t]) => (
            <div key={k} className="border-t border-line py-8 md:border-l md:border-t-0 md:px-8 md:first:border-l-0 md:first:pl-0">
              <dd className="t-display text-[clamp(3rem,7vw,7rem)] text-ink">{v}</dd>
              <dt className="t-label mt-3 text-sky">{k}</dt>
              <dd className="t-body mt-3 max-w-[34ch]">{t}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Cta title="Need a location we don't list?" />
    </>
  );
}
