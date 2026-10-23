"use client";

import { useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { ScrollProvider } from "@/components/ScrollProvider";
import { ContentSections } from "@/components/ContentSections";
import { NavDots } from "@/components/NavDots";
import { ScrollProgress } from "@/components/ScrollProgress";

/**
 * Dynamically import the 3D scene to avoid SSR issues with Three.js / R3F.
 * The `ssr: false` is critical — WebGL context doesn't exist on the server.
 */
const Scene3D = dynamic(() => import("@/components/Scene3D"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <div className="status-badge">
        <span className="status-dot" />
        Initializing WebGL Pipeline
      </div>
    </div>
  ),
});

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  /**
   * Callback fired by ScrollProvider whenever scroll position changes.
   * Drives both the 3D scene animations and the UI state.
   */
  const handleScrollUpdate = useCallback(
    (progress: number, section: number) => {
      setScrollProgress(progress);
      setActiveSection(section);
    },
    []
  );

  return (
    <>
      {/* Subtle noise texture overlay for film grain effect */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Ambient grid background */}
      <div className="ambient-grid" aria-hidden="true" />

      {/* Fixed scroll progress indicator */}
      <ScrollProgress progress={scrollProgress} />

      {/* Navigation dots */}
      <NavDots activeSection={activeSection} totalSections={3} />

      {/* Main workflow grid */}
      <ScrollProvider
        containerRef={containerRef}
        onScrollUpdate={handleScrollUpdate}
      >
        <div ref={containerRef} className="workflow-grid">
          {/* ═══ LEFT COLUMN: Pinned 3D WebGL Canvas ═══ */}
          <div className="canvas-column" data-scroll-pin="true">
            <Scene3D scrollProgress={scrollProgress} />
            {/* Edge fade to blend canvas into content */}
            <div className="canvas-edge-fade" aria-hidden="true" />
          </div>

          {/* ═══ RIGHT COLUMN: Scrolling Content Sections ═══ */}
          <div className="content-column">
            <ContentSections activeSection={activeSection} />
          </div>
        </div>
      </ScrollProvider>
    </>
  );
}
