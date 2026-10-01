"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, useState } from "react";
import { EASE, Marquee, Reveal, SplitHeading } from "../motion";
import { recruiting } from "@/content/recruiting";

export function StudentsHero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);
  const open = recruiting.status === "open";

  return (
    <section ref={ref} className="grain relative isolate flex min-h-[100svh] items-end overflow-hidden bg-ink text-paper">
      <motion.div style={reduce ? undefined : { y, scale }} className="absolute inset-0 -z-10">
        <Image
          src="/images/joshua-tree.jpg"
          alt="Graphite members on a boulder at Joshua Tree"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_35%]"
        />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/30 to-ink/20" />

      <div className="container-page pt-32 pb-14 md:pb-20">
        <motion.a
          href="#apply"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="inline-flex items-center gap-2.5 rounded-full border border-paper/20 bg-ink/30 px-4 py-2 text-sm backdrop-blur-md transition-colors hover:border-paper/50"
        >
          <span className={`h-2 w-2 rounded-full ${open ? "bg-emerald-400" : "bg-steel"}`} />
          {open ? `${recruiting.cycle} applications are open` : `${recruiting.next} recruiting: join the list`}
          <span>→</span>
        </motion.a>
        <SplitHeading
          as="h1"
          immediate
          delay={0.3}
          text="Find your people. Do *real* work."
          className="mt-8 max-w-5xl text-[clamp(3rem,9vw,9rem)] leading-[0.9] font-semibold tracking-[-0.05em]"
        />
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: EASE }}
          className="mt-8 max-w-xl text-lg leading-relaxed text-paper/75 md:text-xl"
        >
          Graphite is a student-run consulting group across all five Claremont Colleges. You will ship client work in
          your first semester, and you will do it with friends.
        </motion.p>
      </div>
    </section>
  );
}

export function StudentIntro() {
  return (
    <section className="bg-paper py-24 md:py-36">
      <div className="container-page grid gap-12 md:grid-cols-12">
        <p className="eyebrow text-graphite-500 md:col-span-3">Student-run. Community-built.</p>
        <div className="md:col-span-9">
          <SplitHeading
            text="More than a pre-professional club. A *community* that outlasts college."
            className="text-[clamp(2.2rem,4.8vw,4.6rem)] leading-[1] font-semibold tracking-[-0.04em]"
          />
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <Reveal>
              <p className="text-lg leading-relaxed text-graphite-600">
                We recruit across Pomona, CMC, Harvey Mudd, Scripps and Pitzer at the start of every fall and spring
                semester. First-years and second-years are strongly encouraged to apply. No business background
                required: we teach the toolkit.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <figure className="border-l-2 border-steel-deep pl-6">
                <blockquote className="font-serif text-2xl leading-snug italic">
                  “Taking on leadership was the most fulfilling experience of my time in undergrad. It&apos;s truly the
                  Graphite community that has had the most profound impact on me.”
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3 text-sm">
                  <Image
                    src="/images/team/matt-san-luis.jpg"
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover grayscale"
                  />
                  <span>
                    <span className="font-semibold">Matt San Luis</span>
                    <span className="text-graphite-500"> · Former Managing Director</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

const journey = [
  {
    role: "Associate Consultant",
    when: "Semester 1",
    body: "Run through the Graphite curriculum, get paired with an upperclass buddy, and join your first client team.",
    tags: ["Curriculum", "Buddy", "First project"],
  },
  {
    role: "Consultant",
    when: "Semesters 2–3",
    body: "Own workstreams on client projects: interviews, models, the slides that make the final deck.",
    tags: ["Client work", "Specialize", "Mentor"],
  },
  {
    role: "Team Lead",
    when: "After 2 semesters",
    body: "Apply to lead. Manage the client relationship and a team of up to five, with the Director of Client Relations in your corner.",
    tags: ["Client lead", "Manage", "Scope"],
  },
  {
    role: "Executive Board",
    when: "Upperclass",
    body: "Run the firm: strategy, digital, recruiting, professional development. The Managing Director sets the direction.",
    tags: ["Managing Director", "Directors", "Run the org"],
  },
  {
    role: "Alumni",
    when: "Forever",
    body: "Once a member of Graphite, always a member. The alumni network is how the next class gets its coffee chats.",
    tags: ["Network", "Referrals", "Give back"],
  },
];

/** Graphite sheets: each stage stacks over the last as you scroll. */
export function Journey() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <section className="bg-ink text-paper">
      <div className="container-page pt-24 md:pt-36">
        <div className="grid gap-8 md:grid-cols-12">
          <p className="eyebrow text-graphite-400 md:col-span-3">What membership looks like</p>
          <div className="md:col-span-9">
            <SplitHeading
              text="You grow in *layers.* Each one builds on the last."
              className="text-[clamp(2.2rem,4.8vw,4.6rem)] leading-[1] font-semibold tracking-[-0.04em]"
            />
          </div>
        </div>
      </div>

      <div ref={ref} className="relative" style={{ height: reduce ? "auto" : `${journey.length * 70 + 40}vh` }}>
        <div className={reduce ? "container-page space-y-4 py-16" : "sticky top-0 flex h-[100svh] items-center"}>
          <div className={reduce ? "" : "container-page relative h-[440px] w-full md:h-[400px]"}>
            {journey.map((j, i) =>
              reduce ? (
                <SheetCard key={j.role} j={j} i={i} />
              ) : (
                <Sheet key={j.role} i={i} progress={scrollYProgress}>
                  <SheetCard j={j} i={i} />
                </Sheet>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Sheet({ i, progress, children }: { i: number; progress: MotionValue<number>; children: React.ReactNode }) {
  const n = journey.length;
  const start = i / n;
  const end = (i + 0.6) / n;
  const y = useTransform(progress, [start - 0.08, end], i === 0 ? ["0vh", "0vh"] : ["100vh", "0vh"]);
  // once covered, sheets sink back and dim, like layers of graphite under the newest one
  const after = useTransform(progress, [end, 1], [0, n - 1 - i]);
  const scale = useTransform(after, (a) => 1 - a * 0.035);
  const offset = useTransform(after, (a) => a * -18);
  // Darken rather than fade: fading would let the sheets beneath show through.
  const filter = useTransform(after, (a) => `brightness(${1 - a * 0.14})`);

  return (
    <motion.div
      style={{ y, zIndex: i }}
      className="absolute inset-x-5 top-0 md:inset-x-10"
    >
      <motion.div style={{ scale, y: offset, filter }} className="origin-top">
        {children}
      </motion.div>
    </motion.div>
  );
}

function SheetCard({ j, i }: { j: (typeof journey)[number]; i: number }) {
  const tones = ["bg-paper text-ink", "bg-paper-2 text-ink", "bg-steel text-ink", "bg-graphite-700 text-paper", "bg-graphite-900 text-paper ring-1 ring-paper/10"];
  return (
    <article className={`grid min-h-[400px] gap-8 rounded-[28px] p-8 md:grid-cols-12 md:p-12 ${tones[i]}`}>
      <div className="flex flex-col justify-between md:col-span-5">
        <span className="eyebrow opacity-60">
          Layer {String(i + 1).padStart(2, "0")} · {j.when}
        </span>
        <h3 className="mt-6 text-[clamp(2.4rem,5vw,4.5rem)] leading-[0.95] font-semibold tracking-[-0.045em]">
          {j.role.split(" ").map((w, k, arr) => (
            <span key={k}>
              {k === arr.length - 1 && arr.length > 1 ? <span className="font-serif font-normal italic">{w}</span> : w}
              {k < arr.length - 1 ? " " : ""}
            </span>
          ))}
        </h3>
      </div>
      <div className="flex flex-col justify-between gap-8 md:col-span-6 md:col-start-7">
        <p className="text-xl leading-relaxed opacity-80">{j.body}</p>
        <ul className="flex flex-wrap gap-2">
          {j.tags.map((t) => (
            <li key={t} className="rounded-full border border-current/20 px-3.5 py-1.5 text-sm opacity-80">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

const perks = [
  {
    title: "The Graphite Curriculum",
    body: "Workshops run by the Director of Professional Development: presentation craft, Excel, market sizing, pricing and more. Then ongoing career resources.",
  },
  {
    title: "The buddy system",
    body: "Every first-year is paired with an upperclass member for mentorship through college and the consulting path.",
  },
  {
    title: "Recruiting, together",
    body: "Coffee-chat notes, interview debriefs and an alumni network that picks up the phone. Nobody recruits alone.",
  },
  {
    title: "Socials & service",
    body: "Dinners, trips and community service with people from all five colleges. The friendships are the point.",
  },
];

export function Life() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], ["8%", "-12%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["-6%", "10%"]);
  const y3 = useTransform(scrollYProgress, [0, 1], ["14%", "-6%"]);

  return (
    <section className="bg-paper py-24 md:py-36">
      <div className="container-page">
        <div className="grid gap-8 md:grid-cols-12">
          <p className="eyebrow text-graphite-500 md:col-span-3">Life at Graphite</p>
          <div className="md:col-span-9">
            <SplitHeading
              text="Serious about the work. *Not* about ourselves."
              className="text-[clamp(2.2rem,4.8vw,4.6rem)] leading-[1] font-semibold tracking-[-0.04em]"
            />
          </div>
        </div>

        <div ref={ref} className="mt-16 grid grid-cols-12 gap-3 md:mt-24 md:gap-5">
          <motion.div style={reduce ? undefined : { y: y1 }} className="relative col-span-7 aspect-[4/5] overflow-hidden rounded-[22px] md:col-span-4">
            <Image src="/images/friends-stairs.jpg" alt="Graphite members laughing on the stairs" fill sizes="(min-width:768px) 33vw, 60vw" className="object-cover" />
          </motion.div>
          <motion.div style={reduce ? undefined : { y: y2 }} className="relative col-span-5 mt-16 aspect-[3/4] overflow-hidden rounded-[22px] md:col-span-3 md:mt-32">
            <Image src="/images/campus.jpg" alt="The Claremont Colleges campus with the San Gabriel mountains" fill sizes="(min-width:768px) 25vw, 40vw" className="object-cover" />
          </motion.div>
          <motion.div style={reduce ? undefined : { y: y3 }} className="relative col-span-12 aspect-[3/2] overflow-hidden rounded-[22px] md:col-span-5 md:mt-10">
            <Image src="/images/exec-stairs.jpg" alt="Graphite members together at the Kravis Center" fill sizes="(min-width:768px) 42vw, 100vw" className="object-cover" />
          </motion.div>
        </div>

        <div className="mt-20 grid gap-px overflow-hidden rounded-[24px] bg-ink/10 ring-1 ring-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08} className="bg-paper p-7 md:p-8">
              <span className="font-mono text-xs text-graphite-500">0{i + 1}</span>
              <h3 className="mt-8 text-xl font-semibold tracking-tight">{p.title}</h3>
              <p className="mt-3 leading-relaxed text-graphite-600">{p.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const destinations = ["Goldman Sachs", "Jane Street", "Palantir", "Bain", "McKinsey", "BlackRock", "J.P. Morgan"];

export function Destinations() {
  return (
    <section className="bg-ink py-20 text-paper md:py-28">
      <div className="container-page mb-10 grid gap-6 md:grid-cols-12">
        <p className="eyebrow text-graphite-400 md:col-span-3">Where members recruit</p>
        <p className="text-2xl leading-snug tracking-tight text-paper/85 md:col-span-7 md:text-3xl">
          Every interview gets logged, debriefed and passed down, so each class recruits{" "}
          <span className="font-serif italic">better than the last.</span>
        </p>
      </div>
      <Marquee duration={38}>
        {destinations.map((d) => (
          <span key={d} className="flex items-center px-8 text-[clamp(2rem,5vw,4rem)] font-semibold tracking-[-0.04em] text-paper/85 md:px-12">
            {d}
            <span className="ml-16 h-2 w-2 rotate-45 bg-steel md:ml-24" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}

export function Recruiting() {
  const open = recruiting.status === "open";
  return (
    <section id="apply" className="scroll-mt-16 bg-paper py-24 md:py-36">
      <div className="container-page grid gap-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="eyebrow text-graphite-500">{open ? `${recruiting.cycle} recruiting` : "Recruiting"}</p>
          <SplitHeading
            text={open ? "Applications are *open.*" : `See you in *${recruiting.next.split(" ")[0]}.*`}
            className="mt-5 text-[clamp(2.5rem,5.5vw,5rem)] leading-[0.98] font-semibold tracking-[-0.045em]"
          />
          <p className="mt-6 max-w-md text-lg leading-relaxed text-graphite-600">
            {open
              ? "We recruit for two tracks. Strategy runs group and final interviews; Digital adds a technical case."
              : recruiting.closedMessage}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {open ? (
              recruiting.applications.map((a, i) => (
                <a
                  key={a.href}
                  href={a.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`group inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm font-medium transition-colors ${
                    i === 0 ? "bg-ink text-paper hover:bg-graphite-700" : "border border-ink/20 hover:border-ink"
                  }`}
                >
                  {a.label}
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </a>
              ))
            ) : (
              <a
                href={recruiting.mailingList}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-graphite-700"
              >
                Join the mailing list
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
            )}
          </div>
          <p className="mt-10 text-sm leading-relaxed text-graphite-500">
            Questions? Email {recruiting.contact.name}, {recruiting.contact.title}, at{" "}
            <a href={`mailto:${recruiting.contact.email}`} className="text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
              {recruiting.contact.email}
            </a>
            .
          </p>
        </div>

        <div className="md:col-span-7">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-graphite-500">{recruiting.cycle} calendar</p>
            <p className="eyebrow text-graphite-500">Decisions · {recruiting.decisions}</p>
          </div>
          <div className="mt-5 space-y-3">
            {recruiting.calendar.map((phase, i) => (
              <CalendarPhase key={phase.phase} phase={phase} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CalendarPhase({
  phase,
  defaultOpen,
}: {
  phase: (typeof recruiting.calendar)[number];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-[18px] bg-paper-2 ring-1 ring-ink/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-6 py-5 text-left"
      >
        <span className="text-lg font-semibold tracking-tight">{phase.phase}</span>
        <span className={`text-xl transition-transform duration-300 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="px-6"
          >
            {phase.items.map((it) => (
              <li key={it.what} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-ink/10 py-3.5 last:pb-5">
                <span>
                  {it.what}
                  {"where" in it && it.where && <span className="text-graphite-500"> · {it.where}</span>}
                </span>
                <span className="font-mono text-sm text-graphite-600">{it.when}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

const voices = [
  {
    quote:
      "Graphite exposed me to a wide range of industries and business challenges, sharpening my problem-solving skills and helping me define my career interests.",
    name: "Sumanje C.",
    role: "Former Team Lead",
  },
  {
    quote:
      "What I cherished most was the tight-knit group. I met amazing people who pushed me to be the best version of myself, and these connections will last for the rest of my life.",
    name: "Sunny Wang",
    role: "Former Director of Recruiting",
    photo: "/images/team/sunny-wang.jpg",
  },
  {
    quote:
      "While the skills I gained have been invaluable, it's truly the Graphite community that has had the most profound impact on me.",
    name: "Matt San Luis",
    role: "Former Managing Director",
    photo: "/images/team/matt-san-luis.jpg",
  },
];

export function Voices() {
  return (
    <section className="bg-paper-2 py-24 md:py-32">
      <div className="container-page">
        <p className="eyebrow text-graphite-500">From alumni</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {voices.map((v, i) => (
            <Reveal key={v.name} delay={i * 0.08} className="flex flex-col justify-between rounded-[22px] bg-paper p-8 ring-1 ring-ink/5">
              <p className="font-serif text-xl leading-snug italic">“{v.quote}”</p>
              <div className="mt-8 flex items-center gap-3 text-sm">
                {v.photo ? (
                  <Image src={v.photo} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover grayscale" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-xs text-paper">
                    {v.name
                      .split(" ")
                      .map((s) => s[0])
                      .join("")}
                  </span>
                )}
                <span>
                  <span className="block font-semibold">{v.name}</span>
                  <span className="text-graphite-500">{v.role}</span>
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "Who can apply?",
    a: "Any student at Pomona, Claremont McKenna, Harvey Mudd, Scripps or Pitzer. First-years and second-years are strongly encouraged.",
  },
  {
    q: "Strategy or Digital?",
    a: "Strategy works on market entry, positioning, pricing and growth questions. Digital builds: product design, software, data and AI work. Digital recruiting adds a technical case. You can apply to either.",
  },
  {
    q: "Do I need business experience?",
    a: "No. New members go through the Graphite curriculum (presentations, Excel, market sizing, pricing) before and alongside their first project.",
  },
  {
    q: "What does the process look like?",
    a: "Club fairs, info sessions and coffee chats first. Then an application, followed by group and final interviews for Strategy, or behavioral interviews, a technical case and finals for Digital.",
  },
  {
    q: "How do I stay in the loop?",
    a: "Join the mailing list and follow @thegraphitegroup on Instagram. Dates for each cycle are posted on this page.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-paper py-24 md:py-32">
      <div className="container-page grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="eyebrow text-graphite-500">FAQ</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
            Good <span className="font-serif font-normal italic">questions.</span>
          </h2>
        </div>
        <div className="md:col-span-8">
          {faqs.map((f, i) => (
            <div key={f.q} className="border-b border-ink/10">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-center justify-between gap-6 py-6 text-left text-xl font-medium tracking-tight md:text-2xl"
              >
                {f.q}
                <span className={`shrink-0 text-2xl transition-transform duration-300 ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="max-w-2xl overflow-hidden pb-6 text-lg leading-relaxed text-graphite-600"
                  >
                    {f.a}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
