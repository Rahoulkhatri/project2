import Link from "next/link";
import { Magnetic } from "@/components/ui/Magnetic";

/** Closing band shared by the inner pages. */
export function Cta({ title = "Bring us your slowest route.", cta = "Talk to an engineer", href = "/contact" }: { title?: string; cta?: string; href?: string }) {
  return (
    <section aria-label="Next step" className="relative border-t border-line px-[var(--gutter)] py-[16vh]">
      <div className="grid grid-cols-12 items-end gap-y-8">
        <h2 className="t-display col-span-12 text-[clamp(2.4rem,6vw,6.4rem)] text-ink md:col-span-8">{title}</h2>
        <div className="col-span-12 md:col-span-4 md:justify-self-end">
          <Magnetic strength={0.25}>
            <Link href={href} className="t-label group inline-flex h-12 items-center gap-3 border border-sky bg-sky px-6 text-bg transition-colors duration-300 hover:bg-transparent hover:text-sky">
              {cta}
              <span className="block h-px w-4 bg-current transition-all duration-300 group-hover:w-7" />
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
