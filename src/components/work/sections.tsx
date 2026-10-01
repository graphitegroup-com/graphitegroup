"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Lattice } from "../lattice";
import { EASE, Reveal, SplitHeading } from "../motion";
import { caseStudies, digitalArchive, practices, type Practice } from "@/content/site";

export function WorkHero() {
  const reduce = useReducedMotion();
  return (
    <section className="grain relative isolate overflow-hidden bg-ink text-paper">
      <Lattice className="absolute inset-0 -z-10 h-full w-full opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent to-ink" />
      <div className="container-page pt-36 pb-20 md:pt-48 md:pb-28">
        <p className="eyebrow text-graphite-400">Our work</p>
        <SplitHeading
          as="h1"
          immediate
          delay={0.15}
          text="77 projects. 9 sectors. *Two* ways in."
          className="mt-6 max-w-5xl text-[clamp(2.9rem,8vw,8rem)] leading-[0.92] font-semibold tracking-[-0.05em]"
        />
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: EASE }}
          className="mt-14 grid gap-3 sm:grid-cols-2 md:max-w-3xl"
        >
          {practices.map((p) => (
            <a
              key={p.slug}
              href={`#${p.slug}`}
              className="group flex items-center justify-between rounded-[18px] border border-paper/15 px-6 py-5 transition-colors hover:border-paper/50 hover:bg-paper/5"
            >
              <span>
                <span className="block text-xl font-semibold tracking-tight">{p.name}</span>
                <span className="text-sm text-paper/60">{p.kicker}</span>
              </span>
              <span className="transition-transform duration-300 group-hover:translate-y-1">↓</span>
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function PracticeSection({ p, dark }: { p: Practice; dark?: boolean }) {
  return (
    <section
      id={p.slug}
      className={`scroll-mt-16 py-24 md:py-36 ${dark ? "bg-ink text-paper" : "bg-grid-paper bg-paper text-ink"}`}
    >
      <div className="container-page">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className={`eyebrow ${dark ? "text-steel" : "text-steel-ink"}`}>{p.kicker}</p>
            <h2 className="mt-5 text-[clamp(3rem,6vw,5.5rem)] leading-[0.92] font-semibold tracking-[-0.05em]">
              {p.name.split(" ")[0]} <span className="font-serif font-normal italic">{p.name.split(" ")[1]}</span>
            </h2>
          </div>
          <Reveal className="md:col-span-6 md:col-start-7">
            <p className={`text-xl leading-relaxed ${dark ? "text-paper/75" : "text-graphite-600"}`}>{p.long}</p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {p.sectors.map((s) => (
                <li
                  key={s}
                  className={`rounded-full border px-3.5 py-1.5 text-sm ${dark ? "border-paper/15 text-paper/75" : "border-ink/15 text-graphite-600"}`}
                >
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className={`mt-20 grid gap-px overflow-hidden rounded-[24px] sm:grid-cols-2 lg:grid-cols-5 ${dark ? "bg-paper/10 ring-1 ring-paper/10" : "bg-ink/10 ring-1 ring-ink/10"}`}>
          {p.services.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.06} className={`group p-7 ${dark ? "bg-graphite-950" : "bg-paper"}`}>
              <span className={`font-mono text-xs ${dark ? "text-graphite-400" : "text-graphite-500"}`}>0{i + 1}</span>
              <h3 className="mt-10 text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className={`mt-3 leading-relaxed ${dark ? "text-paper/60" : "text-graphite-600"}`}>{s.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DigitalArchive() {
  return (
    <section className="bg-ink pb-24 text-paper md:pb-36">
      <div className="container-page">
        <p className="eyebrow text-graphite-400">Graphite Digital · archive</p>
        <ol className="mt-8 border-t border-paper/10">
          {digitalArchive.map((d, i) => (
            <Reveal as="li" key={d.client} delay={i * 0.05} className="group grid gap-2 border-b border-paper/10 py-6 transition-colors hover:bg-paper/[0.03] md:grid-cols-12 md:items-baseline md:gap-6">
                <span className="font-mono text-sm text-steel md:col-span-1">{d.year}</span>
                <span className="text-xl font-semibold tracking-tight md:col-span-4">{d.client}</span>
                <span className="text-paper/65 md:col-span-7">{d.work}</span>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

const filters = ["All", "Strategy", "Digital"] as const;

export function CaseIndex() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const items = caseStudies.filter((c) => filter === "All" || c.practice === filter);

  return (
    <section className="bg-paper py-24 md:py-36">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="eyebrow text-graphite-500">Case studies</p>
            <SplitHeading
              text="Selected *engagements*"
              className="mt-5 text-[clamp(2.2rem,4.8vw,4.6rem)] leading-[1] font-semibold tracking-[-0.04em]"
            />
          </div>
          <div className="flex gap-1 rounded-full bg-paper-2 p-1 ring-1 ring-ink/5" role="tablist">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className="relative rounded-full px-5 py-2 text-sm"
              >
                {filter === f && (
                  <motion.span layoutId="case-filter" className="absolute inset-0 rounded-full bg-ink" transition={{ duration: 0.4, ease: EASE }} />
                )}
                <span className={`relative transition-colors ${filter === f ? "text-paper" : "text-graphite-600"}`}>{f}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {items.map((c) => (
              <motion.article
                layout
                key={c.client}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="flex flex-col justify-between rounded-[22px] bg-paper-2 p-7 ring-1 ring-ink/5"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="eyebrow text-steel-ink">{c.practice}</span>
                    <span className="text-graphite-500">{c.sector}</span>
                  </div>
                  <h3 className="mt-8 text-3xl font-semibold tracking-[-0.03em]">{c.client}</h3>
                  <p className="font-serif text-xl text-steel-deep italic">{c.title}</p>
                  <p className="mt-5 leading-relaxed text-graphite-600">{c.summary}</p>
                </div>
                <div className="mt-8 border-t border-ink/10 pt-5">
                  <p className="leading-relaxed">{c.outcome}</p>
                  {c.link && (
                    <a href={c.link.href} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-steel-ink hover:underline">
                      {c.link.label} ↗
                    </a>
                  )}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

export function WorkCTA() {
  return (
    <section className="bg-paper pb-24 md:pb-36">
      <div className="container-page">
        <Reveal>
          <Link
            href="/#contact"
            className="group flex flex-col justify-between gap-8 rounded-[28px] bg-ink p-10 text-paper transition-colors hover:bg-graphite-900 md:flex-row md:items-end md:p-14"
          >
            <p className="max-w-2xl text-[clamp(2rem,4.5vw,4rem)] leading-[1] font-semibold tracking-[-0.04em]">
              Your company could be <span className="font-serif font-normal italic">project 78.</span>
            </p>
            <span className="inline-flex items-center gap-3 self-start rounded-full bg-paper px-6 py-3.5 text-sm font-medium text-ink transition-colors group-hover:bg-steel md:self-auto">
              Start a project <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
