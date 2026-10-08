"use client";

import Image from "next/image";
import { AccordionGrid, Band, GradTitle, PhotoHero, Pill, Section, Testimonials } from "../gg";
import { recruiting as recruitingDefaults } from "@/content/recruiting";
import { useSiteContent } from "@/lib/use-site-content";

const whyJoin = [
  {
    title: "Impactful work",
    body: "Consultants work on high-impact projects that help clients solve complex business problems: developing strategies, optimizing operations and driving growth.",
  },
  {
    title: "Professional development",
    body: "Formal training, mentorship and coaching. You will learn from experienced members, build new skills and prepare for a career in consulting or beyond.",
  },
  {
    title: "Collaborative environment",
    body: "Members work closely with each other and with clients. You will be part of a supportive team and meet students and professionals who share your interests.",
  },
  {
    title: "Diverse clientele",
    body: "Clients span healthcare, technology, financial services and more, exposing members to many business models, challenges and opportunities.",
  },
  {
    title: "Strong culture",
    body: "Graphite has a culture of integrity, excellence and innovation, with social events and community service throughout the year.",
  },
  {
    title: "Early leadership",
    body: "After two semesters, members can apply to lead a project team, and later to run the organization on the executive board.",
  },
];

const whyConsulting = [
  { title: "Make a difference", body: "Work on complex projects that require critical thinking, and see the impact of your work on organizations firsthand." },
  { title: "Keep learning", body: "Projects across industries and sectors expose you to new challenges and constant opportunities to grow." },
  { title: "Build your network", body: "Consulting opens doors to a wide network of professionals, including industry leaders and executives." },
  { title: "Discover consulting with Graphite", body: "Gain skills in business analysis, strategy, teamwork and leadership, and build your resume with real client work." },
];

const member = [
  {
    title: "Leadership",
    body: "After two semesters, apply to lead a project: manage the client relationship and a team of up to five consultants, with support from the Director of Client Relations. Executive positions follow.",
    image: "/images/exec-stairs.jpg",
    position: "50% 35%",
  },
  {
    title: "Mentorship",
    body: "Every first-year is paired with an upperclass buddy. These pairings provide guidance through college and the start of a consulting career.",
    image: "/images/friends-stairs.jpg",
    position: "50% 30%",
  },
  {
    title: "The Graphite Curriculum",
    body: "The Director of Professional Development runs workshops on presentations, Excel, market sizing, pricing strategy and more, followed by ongoing career resources.",
    image: "/images/campus.jpg",
    position: "50% 50%",
  },
];

const alumni = [
  {
    quote: "Taking on leadership was the most fulfilling experience of my time in undergrad. While the skills I gained have been invaluable, it's truly the Graphite community that has had the most profound impact on me.",
    name: "Matt San Luis",
    org: "Former Managing Director",
  },
  {
    quote: "Graphite exposed me to a wide range of industries and business challenges, sharpening my problem-solving skills and helping me define my career interests and build a quality network.",
    name: "Sumanje C.",
    org: "Former Team Lead",
  },
  {
    quote: "What I cherished most was the close-knit group. I met amazing people who pushed me to be the best version of myself, and those connections will last for the rest of my life.",
    name: "Sunny Wang",
    org: "Former Director of Recruiting",
  },
];

export function StudentsPageView() {
  const recruiting = { ...recruitingDefaults, ...useSiteContent().recruiting };
  const open = recruiting.status === "open";

  return (
    <>
      <PhotoHero image="/images/joshua-tree.jpg" position="50% 45%" align="center" height="h-[460px] md:h-[560px]" title="Elevate Your Impact" />

      <Section id="recruiting">
        <div className="mx-auto max-w-3xl text-center">
          <GradTitle className="t-h2">{open ? `${recruiting.cycle} Applications Open` : `${recruiting.next} Recruiting`}</GradTitle>
          <p className="t-body mt-5">
            {open ? `${recruiting.cycle} recruiting is in progress.` : recruiting.closedMessage} Questions? Email{" "}
            {recruiting.contact.name}, {recruiting.contact.title}, at{" "}
            <a href={`mailto:${recruiting.contact.email}`} className="link-u text-ink">
              {recruiting.contact.email}
            </a>
            .
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {open ? (
              recruiting.applications.map((a, i) => (
                <Pill key={a.href} href={a.href} variant={i === 0 ? "dark" : "outline"}>
                  {a.label}
                </Pill>
              ))
            ) : (
              <Pill href={recruiting.mailingList}>Stay updated</Pill>
            )}
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-5 md:grid-cols-3">
          {recruiting.calendar.map((phase) => (
            <div key={phase.phase} className="card-glow rounded-[6px] bg-white p-7">
              <h3 className="t-h4">{phase.phase}</h3>
              <ul className="mt-4 space-y-3 text-[15px]">
                {phase.items.map((it) => (
                  <li key={it.what} className="border-t border-line pt-3">
                    <span className="block font-medium">{it.what}</span>
                    <span className="text-text">
                      {it.when}
                      {"where" in it && it.where ? ` · ${it.where}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-[15px] font-semibold">Decisions are released {recruiting.decisions}.</p>
      </Section>

      <Band>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <figure>
            <blockquote className="text-[1.35rem] leading-snug text-band-muted italic">“{alumni[0].quote}”</blockquote>
            <figcaption className="mt-6">
              <span className="block font-semibold">{alumni[0].name}</span>
              <span className="text-band-muted">{alumni[0].org}</span>
            </figcaption>
          </figure>
          <div>
            <h2 className="t-h2">Student-run. Community-built.</h2>
            <p className="mt-6 text-lg text-band-muted">
              Graphite is a student-run consulting club that provides strategic and operational advice to clients across
              industries. We recruit across all five Claremont Colleges at the start of each fall and spring semester.
              First-years and second-years are strongly encouraged to apply.
            </p>
          </div>
        </div>

        <h2 className="grad-title-band t-h2 mt-28 mb-12 text-center">Why join Graphite?</h2>
        <AccordionGrid items={whyJoin} />
      </Band>

      <Section>
        <p className="mx-auto max-w-4xl text-center text-[clamp(1.3rem,2.2vw,1.75rem)] leading-snug font-medium tracking-[-0.03em]">
          Consulting is a challenging, rewarding career for people who are driven, analytical and passionate about solving
          problems.
        </p>
        <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-2">
          {whyConsulting.map((w) => (
            <div key={w.title} className="card-glow rounded-[6px] bg-white p-8">
              <h3 className="t-h4">{w.title}</h3>
              <p className="t-body mt-3 text-[15px]">{w.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <GradTitle className="t-h1 text-center">Becoming a Graphite Member</GradTitle>
        <p className="t-body mx-auto mt-6 max-w-3xl text-center">
          Graphite is more than a pre-professional club. It is a collaborative, fun and supportive community across the
          Claremont Consortium, where you will sharpen your consulting skills and grow personally and professionally.
        </p>
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {member.map((m, i) => (
            <article key={m.title} className={`card-glow grid overflow-hidden rounded-[6px] bg-white sm:grid-cols-2 ${i === 2 ? "lg:col-span-2" : ""}`}>
              <div className="p-8">
                <GradTitle as="h3" className="t-h3">
                  {m.title}
                </GradTitle>
                <p className="t-body mt-5 text-[15px]">{m.body}</p>
              </div>
              <div className="relative min-h-[260px]">
                <Image src={m.image} alt="" fill sizes="(min-width:1024px) 30vw, 100vw" className="object-cover" style={{ objectPosition: m.position }} />
              </div>
            </article>
          ))}
        </div>
        <div className="mt-12 flex justify-center gap-3">
          <Pill href="/life">Life at Graphite</Pill>
          <Pill href="/people" variant="outline">
            Meet the team
          </Pill>
        </div>
      </Section>

      <Section className="!pt-0">
        <Testimonials items={alumni.slice(1)} title="From our alumni" />
      </Section>
    </>
  );
}
