"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";
import { StoryTrack } from "@/components/story/StoryTrack";
import { Hud } from "@/components/hud/Hud";
import { Cursor } from "@/components/ui/Cursor";
import { Preloader } from "@/components/preloader/Preloader";

// WebGL never renders on the server; the canvas chunk loads behind the preloader.
const Stage = dynamic(() => import("@/components/canvas/Stage"), { ssr: false });

/**
 * Client shell. `after` (the sections below the story) and `footer` arrive as
 * server-rendered children, so Docs can highlight its code at build time.
 */
export function Experience({ after, footer }: { after: ReactNode; footer: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <a href="#features" className="skip-link skip-2">
        Skip the story
      </a>
      <SmoothScroll />
      <Stage />
      <Hud />
      <div id="laptop-tag" aria-hidden className="pointer-events-none fixed left-0 top-0 z-[8] opacity-0">
        <div className="anno">
          <div className="anno-body t-label text-[10px]">
            <div className="text-ink">USER / Karachi, PK</div>
            <div className="text-muted">24.86° N · 67.01° E</div>
          </div>
        </div>
      </div>
      <main id="main" tabIndex={-1} className="relative z-10 outline-none">
        <StoryTrack />
        {after}
      </main>
      <div className="relative z-10 bg-bg">{footer}</div>
      <div aria-hidden className="grain" />
      <Cursor />
      <Preloader />
    </>
  );
}
