"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Lattice } from "../lattice";
import { Mark } from "../mark";
import { EASE, SplitHeading } from "../motion";
import { colleges, site } from "@/content/site";

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="grain relative isolate overflow-hidden bg-ink text-paper">
      <Lattice className="absolute inset-0 -z-10 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_30%,rgba(91,123,176,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-ink" />

      <div className="container-page flex min-h-[100svh] flex-col justify-between pt-28 pb-10 md:pt-36">
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="eyebrow flex flex-wrap items-center gap-x-4 gap-y-2 text-graphite-300"
        >
          <span className="inline-flex items-center gap-2">
            <span className="h-px w-8 bg-steel" /> Student consulting
          </span>
          <span>The Claremont Colleges</span>
          <span>Est. {site.founded}</span>
        </motion.div>

        <div className="grid items-end gap-10 py-14 md:grid-cols-12">
          <div className="md:col-span-9">
            <SplitHeading
              as="h1"
              immediate
              delay={0.25}
              text="Hard questions, *sharpened* into clear moves."
              className="text-[clamp(2.9rem,8.4vw,8.5rem)] leading-[0.92] font-semibold tracking-[-0.045em]"
            />
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9, ease: EASE }}
              className="mt-8 max-w-xl text-lg leading-relaxed text-paper/70 md:text-xl"
            >
              Graphite Group is the consulting group of the Claremont Colleges. Small teams from five colleges deliver
              strategy and digital work for startups, institutions and Fortune 500 teams.
            </motion.p>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.05, ease: EASE }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Link
                href="#contact"
                className="group inline-flex items-center gap-3 rounded-full bg-paper px-6 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-steel"
              >
                Start a project
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/work"
                className="inline-flex items-center gap-3 rounded-full border border-paper/20 px-6 py-3.5 text-sm font-medium text-paper transition-colors hover:border-paper/60"
              >
                See the work
              </Link>
            </motion.div>
          </div>
          <div className="hidden justify-end md:col-span-3 md:flex">
            <Mark assemble delay={0.4} className="h-44 w-44 text-paper/90 lg:h-56 lg:w-56" />
          </div>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.3 }}
          className="flex flex-wrap items-center justify-between gap-4 border-t border-paper/10 pt-5 text-sm text-graphite-300"
        >
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {colleges.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <span className="eyebrow hidden items-center gap-2 sm:inline-flex">
            Scroll
            <motion.span
              animate={reduce ? undefined : { y: [0, 4, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              ↓
            </motion.span>
          </span>
        </motion.div>
      </div>
    </section>
  );
}

/** The team photo opens from a framed card to full bleed as you scroll. */
export function PhotoReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const inset = useTransform(scrollYProgress, [0, 0.75], [14, 0]);
  const radius = useTransform(scrollYProgress, [0, 0.75], [28, 0]);
  const clipPath = useTransform([inset, radius], ([i, r]) => `inset(${i}% ${i}% ${i}% ${i}% round ${r}px)`);
  const scale = useTransform(scrollYProgress, [0, 1], [1.25, 1]);
  const textY = useTransform(scrollYProgress, [0.3, 1], ["40%", "0%"]);
  const textOpacity = useTransform(scrollYProgress, [0.45, 0.85], [0, 1]);

  return (
    <section ref={ref} className="relative h-[180vh] bg-ink">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div style={{ clipPath }} className="absolute inset-0">
          <motion.div style={{ scale }} className="absolute inset-0">
            <Image
              src="/images/group-lawn.jpg"
              alt="Graphite Group members on the lawn at the Kravis Center"
              fill
              sizes="100vw"
              className="object-cover"
              priority={false}
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-ink/10" />
        </motion.div>
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="container-page absolute inset-x-0 bottom-0 pb-12 text-paper md:pb-16"
        >
          <p className="eyebrow text-steel">Who we are</p>
          <p className="mt-4 max-w-4xl text-[clamp(2rem,5vw,4.5rem)] leading-[1] font-semibold tracking-[-0.035em]">
            Small organization. <span className="font-serif font-normal italic">Big</span> impact.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
