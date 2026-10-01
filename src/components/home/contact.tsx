"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { EASE, SplitHeading } from "../motion";
import { site } from "@/content/site";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

const practiceOptions = ["Strategy", "Digital", "Not sure yet"];
const timingOptions = ["This fall", "Next spring", "Just exploring"];

export function Contact() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [practice, setPractice] = useState(practiceOptions[0]);
  const [timing, setTiming] = useState(timingOptions[1]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(form), practice, timing }),
      });
      if (res.ok) return setStatus({ kind: "sent" });
      const body = await res.json().catch(() => ({}));
      if (body.error === "not_configured" || body.error === "delivery_failed") {
        return setStatus({
          kind: "error",
          message: "Our inbox isn't connected yet. Message us on LinkedIn and the Managing Director will reply.",
        });
      }
      setStatus({ kind: "error", message: body.error ?? "Something went wrong. Please try again." });
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." });
    }
  }

  const field =
    "w-full border-b border-paper/20 bg-transparent py-3 text-lg text-paper placeholder:text-paper/30 focus:border-steel focus:outline-none transition-colors";

  return (
    <section id="contact" className="bg-grid-ink relative scroll-mt-10 overflow-hidden bg-ink py-24 text-paper md:py-36">
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-steel-deep/20 blur-[120px]" />
      <div className="container-page relative grid gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="eyebrow text-graphite-400">06 · Work with us</p>
          <SplitHeading
            text="Have a problem *worth* solving?"
            className="mt-5 text-[clamp(2.5rem,5.5vw,5rem)] leading-[0.98] font-semibold tracking-[-0.045em]"
          />
          <p className="mt-6 max-w-md text-lg leading-relaxed text-paper/65">
            Tell us what you are working on. We scope every project with you before staffing, so there is no cost to
            starting the conversation.
          </p>
          <dl className="mt-12 space-y-5 border-t border-paper/10 pt-8 text-sm">
            <div className="flex justify-between gap-6">
              <dt className="text-graphite-400">Fall projects staff</dt>
              <dd>July</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-graphite-400">Spring projects staff</dt>
              <dd>December</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-graphite-400">Prefer LinkedIn?</dt>
              <dd>
                <a href={site.linkedin} className="text-steel hover:underline">
                  Graphite Group ↗
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="md:col-span-7">
          <AnimatePresence mode="wait">
            {status.kind === "sent" ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="flex h-full flex-col justify-center rounded-[24px] border border-paper/10 bg-graphite-900 p-10"
              >
                <p className="eyebrow text-steel">Received</p>
                <p className="mt-4 text-4xl font-semibold tracking-tight">
                  Thank you. <span className="font-serif font-normal italic">We&apos;ll be in touch</span> within a few days.
                </p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={onSubmit} className="space-y-8" exit={{ opacity: 0 }}>
                <div className="grid gap-8 sm:grid-cols-2">
                  <label className="block">
                    <span className="eyebrow text-graphite-400">Name</span>
                    <input name="name" required autoComplete="name" className={field} placeholder="Jane Founder" />
                  </label>
                  <label className="block">
                    <span className="eyebrow text-graphite-400">Email</span>
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className={field}
                      placeholder="jane@company.com"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="eyebrow text-graphite-400">Organization</span>
                  <input name="organization" autoComplete="organization" className={field} placeholder="Company or institution" />
                </label>

                <fieldset>
                  <legend className="eyebrow mb-3 text-graphite-400">Practice</legend>
                  <Chips options={practiceOptions} value={practice} onChange={setPractice} />
                </fieldset>
                <fieldset>
                  <legend className="eyebrow mb-3 text-graphite-400">Timing</legend>
                  <Chips options={timingOptions} value={timing} onChange={setTiming} />
                </fieldset>

                <label className="block">
                  <span className="eyebrow text-graphite-400">What are you trying to figure out?</span>
                  <textarea
                    name="message"
                    required
                    minLength={10}
                    rows={4}
                    className={`${field} resize-none`}
                    placeholder="We're considering expanding into…"
                  />
                </label>
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

                <div className="flex flex-wrap items-center gap-5">
                  <button
                    type="submit"
                    disabled={status.kind === "sending"}
                    className="group inline-flex items-center gap-3 rounded-full bg-paper px-7 py-4 text-sm font-medium text-ink transition-colors hover:bg-steel disabled:opacity-60"
                  >
                    {status.kind === "sending" ? "Sending…" : "Send inquiry"}
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </button>
                  {status.kind === "error" && (
                    <p role="alert" className="max-w-sm text-sm text-steel">
                      {status.message}
                    </p>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={`relative rounded-full border px-4 py-2 text-sm transition-colors ${
            value === o ? "border-paper text-ink" : "border-paper/20 text-paper/75 hover:border-paper/50"
          }`}
        >
          {value === o && (
            <motion.span
              layoutId={`chip-${options[0]}`}
              className="absolute inset-0 -z-0 rounded-full bg-paper"
              transition={{ duration: 0.4, ease: EASE }}
            />
          )}
          <span className="relative">{o}</span>
        </button>
      ))}
    </div>
  );
}
