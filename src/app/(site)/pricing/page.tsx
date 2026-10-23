import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Pricing } from "@/components/story/Pricing";
import { Faq } from "@/components/site/Faq";
import { Cta } from "@/components/site/Cta";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Hobby is free. Pro is $24 per member per month with 25M requests. Scale is custom with a 99.99% SLA. Billed per request, not per idle hour.",
  alternates: { canonical: "/pricing" },
};

const ROWS: [string, string, string, string][] = [
  ["Requests / month", "1M", "25M, then $0.40 / 1M", "Committed volume"],
  ["Bandwidth", "100 GB", "1 TB, then $0.06 / GB", "Negotiated"],
  ["Locations", "All 284", "All 284", "All 284 + dedicated tiers"],
  ["Cold start (p50)", "38 ms", "38 ms, always-warm option", "38 ms, always-warm"],
  ["Preview deploys", "—", "Every pull request", "Every pull request"],
  ["Instant rollbacks", "Last 5 builds", "Last 50 builds", "Unlimited"],
  ["Private networking", "—", "—", "Private links, bring your own cert"],
  ["Support", "Community", "Email, 4 h response", "24/7 on-call, 15 min"],
  ["Uptime SLA", "—", "99.99%, credits on breach", "99.99%, contractual"],
];

const FAQ = [
  { q: "What counts as a request?", a: "Every HTTP request that reaches Kestrel, whether it is served from cache or runs your function. Blocked bot traffic and health checks from our own monitors are not billed." },
  { q: "What happens if I go over my plan?", a: "Nothing breaks. On Hobby we email you at 80% and 100%, and throttle at 110%. On Pro the overage is billed at $0.40 per extra million requests and $0.06 per GB." },
  { q: "Do you charge for idle time?", a: "No. Functions are billed per request and per millisecond of compute actually used. A site nobody visits costs you nothing beyond the seat." },
  { q: "Can I bring my own Postgres?", a: "Yes. Managed Postgres is optional. Any database reachable over TLS works, and Scale adds private links so traffic never touches the public internet." },
  { q: "Is there a contract or minimum?", a: "Hobby and Pro are month to month. Scale starts at $480 a month on an annual commitment, with volume pricing from there." },
  { q: "Where is my data stored?", a: "Your build and static assets are replicated to every location. Database data stays in the region you pick, and replicas only exist where you enable them." },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        code="01"
        label="Pricing"
        model="towers"
        title={
          <>
            Pay per request. <span className="text-muted">Not per idle hour.</span>
          </>
        }
        lead="Three plans, one rule: you are billed for work done, never for waiting. The towers are your load; Pro is where most teams land."
        stats={[
          ["free tier", "1M req"],
          ["pro", "$24"],
          ["sla", "99.99%"],
        ]}
      />

      <Pricing flow />

      <section aria-labelledby="compare-h" className="relative border-t border-line px-[var(--gutter)] py-[12vh]">
        <p className="t-label flex items-center gap-3 text-muted">
          <span className="text-sky">02</span>
          <span className="h-px w-8 bg-line-strong" />
          <span>Compare</span>
        </p>
        <h2 id="compare-h" className="t-display mt-6 max-w-[16ch] text-[clamp(2.2rem,4.6vw,4.6rem)] text-ink">
          Everything, side by side.
        </h2>
        <div className="mt-10 overflow-x-auto">
          <table className="t-mono w-full min-w-[640px] border-collapse text-left text-[13px]">
            <caption className="sr-only">Plan comparison</caption>
            <thead>
              <tr className="border-b border-line-strong">
                <th scope="col" className="w-[28%] py-3 pr-4 font-normal uppercase tracking-[0.08em] text-muted">
                  Feature
                </th>
                {["Hobby", "Pro", "Scale"].map((h) => (
                  <th key={h} scope="col" className={`py-3 pr-4 font-normal uppercase tracking-[0.08em] ${h === "Pro" ? "text-sky" : "text-muted"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([k, a, b, c]) => (
                <tr key={k} className="border-b border-line">
                  <th scope="row" className="py-3 pr-4 font-normal text-muted">
                    {k}
                  </th>
                  <td className="py-3 pr-4 text-ink">{a}</td>
                  <td className="py-3 pr-4 text-ink">{b}</td>
                  <td className="py-3 pr-4 text-ink">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="faq-h" className="relative border-t border-line px-[var(--gutter)] py-[12vh]">
        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-4">
            <p className="t-label flex items-center gap-3 text-muted">
              <span className="text-sky">03</span>
              <span className="h-px w-8 bg-line-strong" />
              <span>Questions</span>
            </p>
            <h2 id="faq-h" className="t-display mt-6 text-[clamp(2.2rem,4.6vw,4.6rem)] text-ink">
              The fine print, in plain words.
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Faq items={FAQ} />
          </div>
        </div>
      </section>

      <Cta title="Not sure which plan fits? Ask us." />
    </>
  );
}
