"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { COMPANY_SIZES, contactSchema, type ContactInput } from "@/lib/contact-schema";
import { Magnetic } from "@/components/ui/Magnetic";

const field =
  "peer w-full min-h-[48px] border-0 border-b border-line-strong bg-transparent px-0 py-3 text-[16px] text-ink outline-none transition-colors duration-300 placeholder:text-muted/60 focus:border-sky";

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <label htmlFor={id} className="t-label block text-muted">
        {label}
      </label>
      {children}
      <p id={`${id}-err`} role="alert" className="t-label mt-1.5 min-h-[1.4em]" style={{ color: "var(--hot)" }}>
        {error}
      </p>
    </div>
  );
}

export function Contact() {
  const [done, setDone] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema), mode: "onTouched" });

  const onSubmit = async (data: ContactInput) => {
    setServerError(null);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error("rejected");
      setDone(json.id);
    } catch {
      setServerError("Something went wrong on our side. Try again in a moment.");
    }
  };

  return (
    <section id="contact" aria-labelledby="contact-h" className="relative border-t border-line px-[var(--gutter)] py-[14vh]">
      <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-5">
          <p className="t-label flex items-center gap-3 text-muted">
            <span className="text-sky">13</span>
            <span className="h-px w-8 bg-line-strong" />
            <span>Talk to an engineer</span>
          </p>
          <h2 id="contact-h" className="t-display mt-6 text-[clamp(2.4rem,5vw,5rem)] text-ink">
            Bring us your slowest route.
          </h2>
          <p className="t-body mt-6 max-w-[38ch]">
            Send us the URL that hurts. A Kestrel engineer will trace it end to end and reply within one working day, usually with a number.
          </p>
          <dl className="t-mono mt-10 max-w-[38ch] text-[12px]">
            {[
              ["reply", "< 1 working day"],
              ["sales", "sales@kestrel.dev"],
              ["security", "security@kestrel.dev"],
            ].map(([k, v]) => (
              <div key={k} className="flex border-t border-line py-2 last:border-b">
                <dt className="w-24 uppercase tracking-[0.08em] text-muted">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.div
                key="done"
                role="status"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="border border-lime/40 bg-panel/60 p-8"
              >
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden>
                  <motion.circle cx="28" cy="28" r="26" stroke="var(--lime)" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }} />
                  <motion.path d="M16 29 l8 8 l16 -18" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.55, ease: [0.33, 1, 0.68, 1] }} />
                </svg>
                <h3 className="t-display mt-6 text-[clamp(1.8rem,3vw,2.8rem)] text-ink">Request received.</h3>
                <p className="t-body mt-3 max-w-[40ch]">An engineer will be in touch within one working day.</p>
                <p className="t-label mt-6 text-muted">
                  trace <span className="text-sky">{done}</span> · 200 OK
                </p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit(onSubmit)} noValidate exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }} className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2" aria-label="Contact form">
                <Field id="name" label="Name" error={errors.name?.message}>
                  <input id="name" autoComplete="name" className={field} aria-invalid={!!errors.name} aria-describedby="name-err" {...register("name")} />
                </Field>
                <Field id="email" label="Work email" error={errors.email?.message}>
                  <input id="email" type="email" autoComplete="email" inputMode="email" className={field} aria-invalid={!!errors.email} aria-describedby="email-err" {...register("email")} />
                </Field>
                <div className="sm:col-span-2">
                  <Field id="size" label="Team size" error={errors.size?.message}>
                    <select id="size" defaultValue="" className={`${field} appearance-none`} aria-invalid={!!errors.size} aria-describedby="size-err" {...register("size")}>
                      <option value="" disabled>
                        Select
                      </option>
                      {COMPANY_SIZES.map((s) => (
                        <option key={s} value={s} className="bg-panel text-ink">
                          {s} people
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field id="message" label="What should we trace?" error={errors.message?.message}>
                    <textarea id="message" rows={4} className={`${field} resize-none`} placeholder="/checkout takes 900 ms from Lagos…" aria-invalid={!!errors.message} aria-describedby="message-err" {...register("message")} />
                  </Field>
                </div>
                <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
                  <Magnetic strength={0.2}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="t-label inline-flex h-12 min-w-[180px] items-center justify-center border border-sky bg-sky px-6 text-bg transition-colors duration-300 hover:bg-transparent hover:text-sky disabled:opacity-60"
                    >
                      {isSubmitting ? "Sending…" : "Send request"}
                    </button>
                  </Magnetic>
                  <p role="alert" className="t-label" style={{ color: "var(--hot)" }}>
                    {serverError}
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
