"use client";

import { useRef, type PointerEvent } from "react";
import { Magnetic } from "@/components/ui/Magnetic";

type Plan = {
  name: string;
  tag: string;
  price: string;
  unit: string;
  span: string;
  featured?: boolean;
  /** The one line that actually separates this plan from the others. */
  diff: string;
  features: string[];
  cta: string;
};

const PLANS: Plan[] = [
  {
    name: "Hobby",
    tag: "01",
    price: "$0",
    unit: "free forever",
    span: "md:col-span-3",
    diff: "1M requests / month",
    features: ["All 284 locations", "100 GB bandwidth", "Community support"],
    cta: "Start free",
  },
  {
    name: "Pro",
    tag: "02",
    price: "$24",
    unit: "per member / month",
    span: "md:col-span-5",
    featured: true,
    diff: "25M requests / month",
    features: ["Preview deploy for every pull request", "1 TB bandwidth, then $0.06 / GB", "Instant rollbacks", "Email support · 4 h response"],
    cta: "Deploy on Pro",
  },
  {
    name: "Scale",
    tag: "03",
    price: "Custom",
    unit: "committed volume",
    span: "md:col-span-4",
    diff: "99.99% uptime SLA · 15 min response",
    features: ["Dedicated cache tiers", "Private links, bring your own cert", "SSO and audit logs"],
    cta: "Talk to us",
  },
];

function Card({ plan, stacked }: { plan: Plan; stacked?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <article
      ref={ref}
      onPointerMove={move}
      data-cursor={plan.featured ? "deploy" : undefined}
      aria-label={`${plan.name} plan`}
      className={`group relative overflow-hidden border bg-panel/80 p-5 backdrop-blur-md md:p-6 ${stacked ? "w-full" : "min-w-[78vw] snap-center md:min-w-0"} ${plan.span} ${
        plan.featured
          ? "border-sky/70 shadow-[0_0_70px_-12px_rgba(56,189,248,0.5)] md:-mt-8 md:pb-10"
          : "border-line"
      }`}
    >
      {/* Light that follows the cursor: a soft fill plus a brighter hairline. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(320px circle at var(--mx, 50%) var(--my, 0%), rgba(56,189,248,0.16), transparent 65%)" }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          padding: 1,
          background: "radial-gradient(200px circle at var(--mx, 50%) var(--my, 0%), rgba(56,189,248,0.9), transparent 70%)",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
        }}
      />
      <div className="relative">
        <p className="t-label flex items-center justify-between text-muted">
          <span>
            <span className="text-sky">{plan.tag}</span> / {plan.name}
          </span>
          {plan.featured && <span className="text-lime">most deployed</span>}
        </p>
        <h3 className="t-display mt-5 text-[clamp(2.2rem,min(5.4vw,8vh),5.6rem)] text-ink md:mt-8">{plan.price}</h3>
        <p className="t-label mt-2 text-muted">{plan.unit}</p>
        <p className="t-mono mt-5 border-y border-line py-2.5 text-[12px] text-lime">{plan.diff}</p>
        <ul className="t-mono mt-3 space-y-1.5 text-[12px] text-ink">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span aria-hidden className="text-sky">
                +
              </span>
              {f}
            </li>
          ))}
        </ul>
        <Magnetic strength={0.25} className="mt-5">
          <a
            href="#contact"
            className={`t-label inline-flex h-11 items-center border px-5 transition-colors duration-300 ${
              plan.featured ? "border-sky bg-sky text-bg hover:bg-transparent hover:text-sky" : "border-line-strong text-ink hover:border-sky hover:text-sky"
            }`}
          >
            {plan.cta}
          </a>
        </Magnetic>
      </div>
    </article>
  );
}

/** : a normal flowing section for phones (cards one under another), instead of the pinned side-scrolling row. */
export function Pricing({ stacked, flow }: { stacked?: boolean; flow?: boolean }) {
  if (flow) {
    return (
      <section id="plans" aria-label="Plans" className="px-[var(--gutter)] py-[10vh]">
        <div className="flex flex-col gap-4 md:grid md:grid-cols-12 md:items-start md:gap-5">
          {PLANS.map((p) => (
            <Card key={p.name} plan={p} stacked />
          ))}
        </div>
      </section>
    );
  }
  return (
    <div
      id={stacked ? "pricing-mobile" : "pricing"}
      className={stacked ? "px-[var(--gutter)] py-[12vh]" : "flex h-full flex-col justify-center px-[var(--gutter)] pb-[13vh] pt-[calc(var(--hud-h)+9vh)]"}
    >
      <h2 data-fade className="t-label mb-6 flex items-center gap-3 font-normal text-muted">
        <span className="text-sky">09</span>
        <span className="h-px w-8 bg-line-strong" />
        <span>Pricing · billed per request, not per idle hour</span>
      </h2>
      <div data-fade className={stacked ? "flex flex-col gap-4" : "flex snap-x items-start gap-4 overflow-x-auto md:grid md:grid-cols-12 md:gap-5 md:overflow-visible"}>
        {PLANS.map((p) => (
          <Card key={p.name} plan={p} stacked={stacked} />
        ))}
      </div>
    </div>
  );
}
