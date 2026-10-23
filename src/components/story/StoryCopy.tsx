"use client";

import { CopyLayer } from "./CopyLayer";
import { RANGE_BY_ID, LAST_SCENE_CODE } from "@/lib/story";
import { BEATS, type Beat } from "@/lib/copy";
import { DeployTerminal } from "./DeployTerminal";
import { QueryPanel } from "./QueryPanel";
import { TotalCounter } from "./TotalCounter";
import { Pricing } from "./Pricing";

/** Keep "38 ms"-style pairs on one line (SplitText would otherwise break at the space). */
const nowrapUnits = (text: string) =>
  text.split(/(d+ ms)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );

const vClass = {
  top: "md:self-start md:pt-[calc(var(--hud-h)+8vh)]",
  middle: "md:self-center",
  bottom: "md:self-end md:pb-[16vh]",
};

function StoryBeat({ beat }: { beat: Beat }) {
  const r = RANGE_BY_ID[beat.scene];
  const left = beat.side === "left";

  return (
    <CopyLayer scene={beat.scene} from={beat.from} to={beat.to}>
      <div className="grid h-full grid-cols-12 px-[var(--gutter)]">
        <div
          className={`col-span-12 self-end pb-28 md:col-span-5 md:pb-0 xl:col-span-4 ${
            left ? "md:col-start-1" : "md:col-start-8 xl:col-start-9"
          } ${vClass[beat.v]}`}
        >
          <p data-fade className="t-label mb-5 flex items-center gap-3 text-muted">
            <span className="text-sky">{r.code}</span>
            <span className="h-px w-8 bg-line-strong" />
            <span>{r.label}</span>
          </p>
          <h2 data-reveal className="t-display text-[clamp(1.85rem,7.2vw,2.5rem)] text-ink md:text-[clamp(2.4rem,4.6vw,4.9rem)]">
            {nowrapUnits(beat.title)}
          </h2>
          <p data-reveal className="t-body mt-6 max-w-[40ch]">
            {beat.body}
          </p>
          <dl data-fade className="beat-specs t-mono mt-6 max-w-[40ch] text-[12px] md:mt-8">
            {beat.specs.map(([k, v]) => (
              <div key={k} className="flex items-baseline border-t border-line py-2 last:border-b">
                <dt className="w-28 shrink-0 uppercase tracking-[0.08em] text-muted">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <span
          data-fade
          aria-hidden
          className={`t-numeral pointer-events-none absolute hidden text-[34vw] md:block ${
            left ? "right-[2vw]" : "left-[2vw]"
          } ${beat.v === "top" ? "bottom-[4vh]" : "top-[6vh]"}`}
        >
          {r.code}
        </span>
      </div>
    </CopyLayer>
  );
}

function HeroCopy() {
  return (
    <CopyLayer scene="origin" from={0} to={0.78}>
      <div className="grid h-full grid-cols-12 px-[var(--gutter)]">
        <div className="col-span-12 self-end pb-[18vh] md:col-span-8 md:pb-[14vh] xl:col-span-7">
          <p data-fade className="t-label mb-7 flex items-center gap-3 text-muted">
            <span className="text-sky">00</span>
            <span className="h-px w-8 bg-line-strong" />
            <span>Kestrel edge network · 284 locations</span>
          </p>
          <h1 className="t-display text-[clamp(2.3rem,11.5vw,3.6rem)] md:text-[clamp(3.1rem,7.6vw,8.8rem)]">
            <span data-reveal className="block text-ink">
              Every request<br />
              has a journey.
            </span>
            <span data-reveal className="block text-muted">
              We make it short.
            </span>
          </h1>
          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:gap-14">
            <p data-reveal className="t-body max-w-[38ch]">
              Deploy once and Kestrel routes, caches and runs every request as close to your users as
              physics allows. Here is one of them, start to finish.
            </p>
            <dl data-fade className="t-mono grid grid-cols-3 gap-x-8 text-[12px] md:shrink-0">
              {[
                ["p50 ttfb", "31 ms"],
                ["countries", "61"],
                ["uptime 90d", "99.995%"],
              ].map(([k, v]) => (
                <div key={k} className="border-l border-line pl-3">
                  <dt className="uppercase tracking-[0.08em] text-muted">{k}</dt>
                  <dd className="mt-1 text-[15px] text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div data-fade className="t-label absolute bottom-[calc(var(--hud-h)+2.5rem)] right-[var(--gutter)] hidden items-center gap-3 text-muted md:flex">
          <span>Scroll to send the request</span>
          <span className="relative block h-10 w-px overflow-hidden bg-line">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-hint_1.8s_var(--ease-power3-in-out)_infinite] bg-sky" />
          </span>
        </div>
      </div>
    </CopyLayer>
  );
}

function DeployCopy() {
  return (
    <CopyLayer scene="deploy" from={0.04} to={0.5} interactive>
      <div className="grid h-full grid-cols-12 px-[var(--gutter)]">
        <div className="col-span-12 self-center md:col-span-7 md:col-start-2">
          <p data-fade className="t-label mb-6 flex items-center gap-3 text-muted">
            <span className="text-lime">{LAST_SCENE_CODE}</span>
            <span className="h-px w-8 bg-line-strong" />
            <span>Deploy</span>
          </p>
          <h2 data-reveal className="t-display text-[clamp(2.1rem,9vw,3rem)] text-ink md:text-[clamp(2.8rem,6.4vw,7rem)]">
            Your request, next. One command.
          </h2>
          <div data-fade className="mt-10 max-w-xl">
            <DeployTerminal />
          </div>
          <p data-fade className="t-label mt-5 text-muted">
            Free for hobby projects · 1M requests/mo · no card
          </p>
        </div>
      </div>
    </CopyLayer>
  );
}

/** All story copy, stacked in one sticky viewport above the canvas. */
export function StoryCopy() {
  return (
    <>
      <HeroCopy />
      {BEATS.map((b) => (
        <StoryBeat key={b.scene} beat={b} />
      ))}
      <CopyLayer scene="database" from={0.1} to={0.92}>
        <div className="grid h-full grid-cols-12 px-[var(--gutter)]">
          <div className="col-span-12 self-end pb-[16vh] md:col-span-5 md:col-start-8 xl:col-start-9">
            <QueryPanel />
          </div>
        </div>
      </CopyLayer>
      <CopyLayer scene="response" from={0.74} to={1.01}>
        <div className="flex h-full items-end justify-end px-[var(--gutter)] pb-[16vh]">
          <TotalCounter />
        </div>
      </CopyLayer>
      <DeployCopy />
      <CopyLayer scene="deploy" from={0.56} to={1} interactive className="max-md:hidden">
        <Pricing />
      </CopyLayer>
    </>
  );
}
