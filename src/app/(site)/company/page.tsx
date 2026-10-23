import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Cta } from "@/components/site/Cta";

export const metadata: Metadata = {
  title: "Company",
  description: "Kestrel started in Karachi because a checkout page took 900 ms to load. We build the edge platform we wanted to use.",
  alternates: { canonical: "/company" },
};

const PRINCIPLES: [string, string][] = [
  ["Measure the whole request.", "A fast function behind a slow DNS lookup is a slow site. We trace from the first byte to the last, and we publish the numbers, including the bad ones."],
  ["Put the code where the user is.", "Latency is geography. The cheapest optimisation is to stop moving packets across oceans, so we run everything at the edge by default."],
  ["Boring beats clever.", "Anycast, a tiered cache and a snapshot restore are old ideas done carefully. We would rather be predictable at 3 a.m. than impressive in a demo."],
];

const TIMELINE: [string, string][] = [
  ["2021", "Two engineers in Karachi cut a storefront's load time from 900 ms to 90 ms by hand, then wrote the tool that did it."],
  ["2022", "First 12 locations and the snapshot runtime. 38 ms cold starts, up from 400."],
  ["2024", "Managed Postgres with same-metro replicas. The first customer outside South Asia."],
  ["2026", "284 locations in 61 countries, 1.2 million requests a second, and still a small team."],
];

export default function CompanyPage() {
  return (
    <>
      <PageHero
        code="01"
        label="Company"
        model="facet"
        title={
          <>
            Built in Karachi. <span className="text-muted">Run everywhere.</span>
          </>
        }
        lead="We started because a checkout page took 900 ms to load, and the fix was never going to be a faster server. It was a shorter journey."
        stats={[
          ["founded", "2021"],
          ["locations", "284"],
          ["req / s", "1.2M"],
        ]}
      />

      <section aria-labelledby="why-h" className="relative border-t border-line px-[var(--gutter)] py-[14vh]">
        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-5">
            <p className="t-label flex items-center gap-3 text-muted">
              <span className="text-sky">02</span>
              <span className="h-px w-8 bg-line-strong" />
              <span>Why we exist</span>
            </p>
            <h2 id="why-h" className="t-display mt-6 text-[clamp(2.4rem,5vw,5.2rem)] text-ink">
              Distance is the slowest part of the internet.
            </h2>
          </div>
          <div className="space-y-6 lg:col-span-6 lg:col-start-7 lg:pt-16">
            <p className="t-body text-[clamp(16px,1.3vw,19px)]">
              Most of a page load is not computation. It is a request crossing the planet and back. You can buy a faster server; you cannot buy a shorter ocean.
            </p>
            <p className="t-body text-[clamp(16px,1.3vw,19px)]">
              So we put the cache, the runtime and the database replica in the same city as your user, and we made deploying to all of them one command. The rest of the platform is detail.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="principles-h" className="relative border-t border-line px-[var(--gutter)] py-[12vh]">
        <p className="t-label flex items-center gap-3 text-muted">
          <span className="text-sky">03</span>
          <span className="h-px w-8 bg-line-strong" />
          <span>How we work</span>
        </p>
        <h2 id="principles-h" className="sr-only">
          Principles
        </h2>
        <ol className="mt-10">
          {PRINCIPLES.map(([t, d], i) => (
            <li key={t} className="grid grid-cols-12 gap-y-3 border-t border-line py-10 last:border-b">
              <span className="t-mono col-span-12 text-[12px] text-sky md:col-span-1">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="t-display col-span-12 text-[clamp(1.8rem,3.2vw,3.2rem)] text-ink md:col-span-6">{t}</h3>
              <p className="t-body col-span-12 max-w-[46ch] md:col-span-4 md:col-start-9">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="timeline-h" className="relative border-t border-line px-[var(--gutter)] py-[12vh]">
        <p className="t-label flex items-center gap-3 text-muted">
          <span className="text-sky">04</span>
          <span className="h-px w-8 bg-line-strong" />
          <span>Timeline</span>
        </p>
        <h2 id="timeline-h" className="t-display mt-6 text-[clamp(2.2rem,4.6vw,4.6rem)] text-ink">
          Small team, long reach.
        </h2>
        <ol className="mt-10 grid grid-cols-1 md:grid-cols-4">
          {TIMELINE.map(([y, t]) => (
            <li key={y} className="border-t border-line py-6 md:border-l md:px-6 md:first:border-l-0 md:first:pl-0">
              <span className="t-display text-[clamp(2rem,3.4vw,3.4rem)] text-sky">{y}</span>
              <p className="t-body mt-3 max-w-[30ch]">{t}</p>
            </li>
          ))}
        </ol>
      </section>

      <Cta title="Want to build this with us?" cta="Say hello" />
    </>
  );
}
