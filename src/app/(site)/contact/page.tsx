import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Contact } from "@/components/sections/Contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send us the URL that hurts. A Kestrel engineer will trace it end to end and reply within one working day.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        code="01"
        label="Contact"
        model="radar"
        title={
          <>
            Bring us <span className="text-muted">your slowest route.</span>
          </>
        }
        lead="Tell us which URL hurts. We will trace it from the first byte to the last and reply within one working day, usually with a number."
        stats={[
          ["reply", "< 1 day"],
          ["sales", "same day"],
          ["on-call", "24/7"],
        ]}
      />
      <Contact />
    </>
  );
}
