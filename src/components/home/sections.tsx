"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Counter, EASE, Marquee, Reveal, SplitHeading } from "../motion";
import { MARK_PIECES } from "../mark";
import { caseStudies, clients, disciplines, engagement, practices, site, testimonials } from "@/content/site";

export function Stats() {
  return (
    <section className="bg-paper">
      <div className="container-page grid grid-cols-2 border-b border-ink/10 md:grid-cols-4">
        {site.stats.map((s, i) => (
          <Reveal
            key={s.label}
            delay={i * 0.08}
            className={`py-10 md:py-14 ${i % 2 ? "pl-6 md:pl-8" : "md:pl-8 md:first:pl-0"} ${
              i > 0 ? "md:border-l md:border-ink/10" : ""
            } ${i % 2 ? "border-l border-ink/10 md:border-l" : ""} ${i > 1 ? "border-t border-ink/10 md:border-t-0" : ""}`}
          >
            <Counter
              to={s.value}
              suffix={s.suffix}
              className="block text-[clamp(3rem,7vw,6rem)] leading-none font-semibold tracking-[-0.05em] tabular-nums"
            />
            <p className="eyebrow mt-3 text-graphite-500">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function ClientMarquee() {
  return (
    <section className="bg-paper py-14 md:py-20">
      <div className="container-page mb-8 flex items-center gap-4">
        <span className="eyebrow text-graphite-500">Trusted by teams at</span>
        <span className="h-px flex-1 bg-ink/10" />
      </div>
      <Marquee duration={45}>
        {clients.map((c) => (
          <span key={c} className="flex items-center">
            <span className="px-8 text-3xl font-semibold tracking-[-0.03em] text-graphite-600 md:px-12 md:text-5xl">
              {c}
            </span>
            <svg viewBox="0 0 100 100" className="h-4 w-4 text-steel-deep" fill="currentColor" aria-hidden>
              <path d={MARK_PIECES[0].d} />
              <path d={MARK_PIECES[3].d} />
            </svg>
          </span>
        ))}
      </Marquee>
    </section>
  );
}

export function Practices() {
  return (
    <section className="bg-grid-paper bg-paper py-24 md:py-36">
      <div className="container-page">
        <div className="grid gap-8 md:grid-cols-12">
          <p className="eyebrow text-graphite-500 md:col-span-3">01 · What we do</p>
          <div className="md:col-span-9">
            <SplitHeading
              text="Two practices. One standard: work you can *act on* Monday morning."
              className="text-[clamp(2.2rem,4.8vw,4.6rem)] leading-[1] font-semibold tracking-[-0.04em]"
            />
          </div>
        </div>

        <div className="mt-16 grid gap-5 md:mt-24 md:grid-cols-2">
          {practices.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.1}>
              <Link
                href={`/work#${p.slug}`}
                className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] p-8 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 md:p-12 ${
                  i === 0 ? "bg-ink text-paper" : "bg-paper-2 text-ink ring-1 ring-ink/5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className={`eyebrow ${i === 0 ? "text-steel" : "text-steel-ink"}`}>{p.kicker}</p>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-500 group-hover:rotate-[-45deg] ${
                      i === 0 ? "border-paper/20 group-hover:bg-paper group-hover:text-ink" : "border-ink/15 group-hover:bg-ink group-hover:text-paper"
                    }`}
                  >
                    →
                  </span>
                </div>
                <h3 className="mt-16 text-5xl font-semibold tracking-[-0.04em] md:text-6xl">
                  {p.name.split(" ")[0]}
                  <br />
                  <span className="font-serif font-normal italic">{p.name.split(" ")[1]}</span>
                </h3>
                <p className={`mt-6 max-w-md text-lg leading-relaxed ${i === 0 ? "text-paper/70" : "text-graphite-600"}`}>
                  {p.summary}
                </p>
                <ul className={`mt-10 divide-y ${i === 0 ? "divide-paper/10 border-paper/10" : "divide-ink/10 border-ink/10"} border-t`}>
                  {p.services.map((s, j) => (
                    <li key={s.title} className="flex items-center justify-between py-3.5 text-[0.95rem]">
                      <span className="flex items-baseline gap-4">
                        <span className={`font-mono text-xs ${i === 0 ? "text-graphite-400" : "text-graphite-500"}`}>
                          0{j + 1}
                        </span>
                        {s.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Pinned horizontal track of case studies, driven by vertical scroll. */
export function SelectedWork() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    const measure = () => {
      if (!track.current) return;
      const d = track.current.scrollWidth - window.innerWidth;
      setDistance(Math.max(0, d));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      ref={section}
      className="relative bg-ink text-paper"
      style={{ height: reduce ? "auto" : `calc(100vh + ${distance}px)` }}
    >
      <div className={reduce ? "py-24" : "sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden"}>
        <div className="container-page mb-10 flex items-end justify-between gap-6 md:mb-14">
          <div>
            <p className="eyebrow text-graphite-400">02 · Selected work</p>
            <h2 className="mt-4 text-[clamp(2.2rem,4.8vw,4.6rem)] leading-[1] font-semibold tracking-[-0.04em]">
              Shipped, published, <span className="font-serif font-normal italic">adopted.</span>
            </h2>
          </div>
          <Link href="/work" className="eyebrow hidden shrink-0 text-paper/70 transition-colors hover:text-paper md:block">
            All work →
          </Link>
        </div>

        <motion.div
          ref={track}
          style={reduce ? undefined : { x }}
          className={`flex gap-5 pl-5 md:pl-10 ${reduce ? "overflow-x-auto pr-5" : "w-max pr-[10vw]"}`}
        >
          {caseStudies.map((c, i) => (
            <article
              key={c.client}
              className="group relative flex h-[58svh] max-h-[480px] min-h-[400px] w-[82vw] shrink-0 flex-col justify-between overflow-hidden rounded-[24px] border border-paper/10 bg-graphite-900 p-7 sm:w-[440px] md:p-9"
            >
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-steel-deep/0 blur-3xl transition-colors duration-700 group-hover:bg-steel-deep/25" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-graphite-400">
                    {String(i + 1).padStart(2, "0")} / {String(caseStudies.length).padStart(2, "0")}
                  </span>
                  <span className="rounded-full border border-paper/15 px-3 py-1 text-xs text-paper/70">
                    {c.practice} · {c.sector}
                  </span>
                </div>
                <h3 className="mt-10 text-4xl font-semibold tracking-[-0.035em]">{c.client}</h3>
                <p className="mt-1 font-serif text-2xl text-steel italic">{c.title}</p>
                <p className="mt-6 text-[0.95rem] leading-relaxed text-paper/65">{c.summary}</p>
              </div>
              <div className="relative border-t border-paper/10 pt-5">
                <p className="eyebrow mb-2 text-graphite-400">Outcome</p>
                <p className="text-[0.95rem] leading-relaxed text-paper/90">{c.outcome}</p>
                {c.link && (
                  <a href={c.link.href} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-steel hover:underline">
                    {c.link.label} ↗
                  </a>
                )}
              </div>
            </article>
          ))}
        </motion.div>

        {!reduce && (
          <div className="container-page mt-10">
            <div className="h-px w-full bg-paper/10">
              <motion.div style={{ width: progress }} className="h-px bg-steel" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function Engagement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="bg-paper py-24 md:py-36">
      <div className="container-page">
        <div className="grid gap-8 md:grid-cols-12">
          <p className="eyebrow text-graphite-500 md:col-span-3">03 · How it works</p>
          <div className="md:col-span-9">
            <SplitHeading
              text="A semester-long engagement, run like a *firm.*"
              className="text-[clamp(2.2rem,4.8vw,4.6rem)] leading-[1] font-semibold tracking-[-0.04em]"
            />
            <Reveal>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-graphite-600">
                Projects run one semester (~12 weeks) or two (~24 weeks). Every team has a dedicated project lead who owns
                communication, plus four to five consultants matched to the problem.
              </p>
            </Reveal>
          </div>
        </div>

        <div ref={ref} className="relative mt-20">
          <div className="absolute top-[22px] right-0 left-0 hidden h-px bg-ink/10 md:block" />
          <motion.div
            style={{ scaleX }}
            className="absolute top-[22px] right-0 left-0 hidden h-px origin-left bg-ink md:block"
          />
          <ol className="grid gap-10 md:grid-cols-4 md:gap-8">
            {engagement.map((e, i) => (
              <Reveal as="li" key={e.step} delay={i * 0.1} className="relative">
                <div>
                  <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-paper font-mono text-xs">
                    {e.step}
                  </span>
                  <h3 className="mt-6 text-2xl font-semibold tracking-tight">{e.title}</h3>
                  <p className="mt-3 leading-relaxed text-graphite-600">{e.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal className="mt-20 grid gap-4 rounded-[24px] bg-paper-2 p-6 ring-1 ring-ink/5 sm:grid-cols-3 md:p-8">
          {[
            ["12 or 24", "weeks per engagement"],
            ["1 + 4–5", "project lead plus consultants"],
            ["July / Dec", "staffing for fall / spring"],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="text-3xl font-semibold tracking-tight">{v}</p>
              <p className="eyebrow mt-1 text-graphite-500">{l}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export function LiberalArts() {
  return (
    <section className="relative overflow-hidden bg-steel py-24 text-ink md:py-32">
      <div className="container-page grid gap-10 md:grid-cols-12">
        <p className="eyebrow text-steel-ink md:col-span-3">04 · Liberal arts in action</p>
        <div className="md:col-span-9">
          <SplitHeading
            text="Your problem doesn't fit one major. *Neither* do we."
            className="text-[clamp(2.2rem,4.8vw,4.6rem)] leading-[1] font-semibold tracking-[-0.04em]"
          />
          <Reveal>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/75">
              Our consultants are economists, engineers, data scientists and policy students from five liberal arts
              colleges. Clients get several worldviews on one question, and our members get to use what they learn on
              problems that matter.
            </p>
          </Reveal>
        </div>
      </div>
      <div className="mt-16 space-y-2">
        <Marquee duration={60}>
          {disciplines.map((d) => (
            <span key={d} className="px-6 text-[clamp(2.5rem,7vw,6rem)] leading-none font-semibold tracking-[-0.045em]">
              {d}
              <span className="pl-12 font-serif font-normal text-ink/40 italic">/</span>
            </span>
          ))}
        </Marquee>
        <Marquee duration={70} reverse>
          {[...disciplines].reverse().map((d) => (
            <span
              key={d}
              className="px-6 font-serif text-[clamp(2.5rem,7vw,6rem)] leading-none text-ink/45 italic"
            >
              {d}
              <span className="pl-12">·</span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

export function Testimonials() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const DURATION = 7000;

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setI((n) => (n + 1) % testimonials.length), DURATION);
    return () => clearTimeout(t);
  }, [i, paused]);

  const t = testimonials[i];

  return (
    <section
      className="bg-paper py-24 md:py-36"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container-page grid gap-10 md:grid-cols-12">
        <p className="eyebrow text-graphite-500 md:col-span-3">05 · In their words</p>
        <div className="md:col-span-9">
          <div className="relative min-h-[320px] md:min-h-[300px]" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.figure
                key={i}
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <blockquote className="text-[clamp(1.6rem,3.2vw,2.9rem)] leading-[1.15] font-medium tracking-[-0.025em]">
                  <span className="font-serif text-steel-deep">“</span>
                  {t.quote}
                  <span className="font-serif text-steel-deep">”</span>
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4">
                  <span className="h-px w-10 bg-ink" />
                  <span>
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-graphite-500"> · {t.org}</span>
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          <div className="mt-10 flex gap-2">
            {testimonials.map((q, n) => (
              <button
                key={q.org}
                type="button"
                onClick={() => setI(n)}
                className="group relative h-8 flex-1"
                aria-label={`Show testimonial from ${q.org}`}
              >
                <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 overflow-hidden rounded bg-ink/10">
                  {n === i && (
                    <motion.span
                      key={`${i}-${paused}`}
                      className="absolute inset-y-0 left-0 bg-ink"
                      initial={{ width: paused ? "100%" : "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: paused ? 0 : DURATION / 1000, ease: "linear" }}
                    />
                  )}
                  {n < i && <span className="absolute inset-0 bg-ink/40" />}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function RLCIE() {
  return (
    <section className="bg-paper pb-24 md:pb-36">
      <div className="container-page">
        <Reveal className="grid gap-8 border-t border-ink/10 pt-12 md:grid-cols-12">
          <p className="eyebrow text-graphite-500 md:col-span-3">Institutional partner</p>
          <div className="md:col-span-6">
            <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
              The consulting arm of the Randall Lewis Center for Innovation & Entrepreneurship.
            </h3>
          </div>
          <p className="leading-relaxed text-graphite-600 md:col-span-3">
            The RLCIE is the premier entrepreneurship institute of the Claremont Colleges. Graphite carries its mission
            into the field: real problems, real founders, real deliverables.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
