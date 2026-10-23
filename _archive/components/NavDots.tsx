"use client";

interface NavDotsProps {
  activeSection: number;
  totalSections: number;
}

/**
 * NavDots
 * ───────
 * Fixed vertical navigation indicators on the right edge.
 * Active dot glows cyan with box-shadow to match the data pulse.
 */
export function NavDots({ activeSection, totalSections }: NavDotsProps) {
  const labels = ["Client Request", "Edge Network", "Server Processing"];

  return (
    <nav className="nav-dots" aria-label="Section navigation">
      {Array.from({ length: totalSections }, (_, i) => (
        <button
          key={i}
          className={`nav-dot ${i === activeSection ? "active" : ""}`}
          onClick={() => {
            // Scroll to the corresponding section
            const sections = document.querySelectorAll(".section-panel");
            sections[i]?.scrollIntoView({ behavior: "smooth" });
          }}
          aria-label={labels[i] ?? `Section ${i + 1}`}
          aria-current={i === activeSection ? "step" : undefined}
        />
      ))}
    </nav>
  );
}

