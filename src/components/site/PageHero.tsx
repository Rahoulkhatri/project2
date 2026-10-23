"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { HeroStage, type ModelName } from "./HeroStage";

const EASE = [0.16, 1, 0.3, 1] as const;

type Props = {
  code: string;
  label: string;
  title: ReactNode;
  lead: string;
  model: ModelName;
  /** Cursor label shown over the 3D model, e.g. "drag". */
  cursor?: string;
  stats?: [string, string][];
  children?: ReactNode;
};

/** Shared hero for the inner pages: a 3D model on one side, an asymmetric block of copy on the other. */
export function PageHero({ code, label, title, lead, model, cursor, stats, children }: Props) {
  const fade = (i: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, delay: 0.15 + i * 0.09, ease: EASE },
  });

  return (
    <section aria-labelledby="page-h" className="relative isolate min-h-[100svh] overflow-hidden">
      <HeroStage model={model} cursor={cursor} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[55%] bg-gradient-to-t from-bg via-bg/85 to-transparent md:hidden" />

      <div className="pointer-events-none relative z-10 grid min-h-[100svh] grid-cols-12 px-[var(--gutter)]">
        <div className="col-span-12 self-end pb-[9vh] pt-[calc(var(--hud-h)+4vh)] md:col-span-6 md:pb-[12vh] xl:col-span-5">
          <motion.p {...fade(0)} className="t-label mb-6 flex items-center gap-3 text-muted">
            <span className="text-sky">{code}</span>
            <span className="h-px w-8 bg-line-strong" />
            <span>{label}</span>
          </motion.p>
          <motion.h1 id="page-h" {...fade(1)} className="t-display text-[clamp(2.4rem,6.2vw,6.4rem)] text-ink">
            {title}
          </motion.h1>
          <motion.p {...fade(2)} className="t-body mt-6 max-w-[44ch]">
            {lead}
          </motion.p>
          {stats && (
            <motion.dl {...fade(3)} className="t-mono mt-8 grid max-w-md grid-cols-3 gap-x-5 text-[12px]">
              {stats.map(([k, v]) => (
                <div key={k} className="border-l border-line pl-3">
                  <dt className="uppercase tracking-[0.08em] text-muted">{k}</dt>
                  <dd className="mt-1 text-[15px] text-ink">{v}</dd>
                </div>
              ))}
            </motion.dl>
          )}
          {children && (
            <motion.div {...fade(4)} className="pointer-events-auto mt-8 flex flex-wrap items-center gap-4">
              {children}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
