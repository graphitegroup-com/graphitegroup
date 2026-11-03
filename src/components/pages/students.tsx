"use client";

import Image from "next/image";
import { Accordion, Chip, Closing, Eyebrow, PageHeader, Pill, Section, Testimonials } from "../gg";
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
      <PageHeader
        title={
          <>
            Elevate your <em>impact</em>
          </>
        }
        sub="Client consulting, structured training and a community across all five Claremont Colleges. First-years and second-years are strongly encouraged to apply."
      />

      <Section id="recruiting" className="!pt-2">
        <div className="card mx-auto max-w-4xl px-6 py-10 text-center md:px-12">
          <div className="flex items-center justify-center gap-3">
            <Eyebrow>Recruiting</Eyebrow>
            <Chip>
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${open ? "bg-[#1d8a4a]" : "bg-text"}`} />
              {open ? "Open" : "Closed"}
            </Chip>
          </div>
          <h2 className="t-h2 mt-5">{open ? `${recruiting.cycle} applications are open` : `${recruiting.next} recruiting`}</h2>
          <p className="t-body mx-auto mt-5 max-w-2xl">
            {open ? `${recruiting.cycle} recruiting is in progress.` : recruiting.closedMessage} Questions? Email {recruiting.contact.name},{" "}
            {recruiting.contact.title}, at{" "}
            <a href={`mailto:${recruiting.contact.email}`} className="link-u text-coal [overflow-wrap:anywhere]">
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

        <div className="mx-auto mt-6 grid max-w-4xl gap-5 md:grid-cols-3">
          {recruiting.calendar.map((phase) => (
            <div key={phase.phase} className="card p-6">
              <h3 className="t-h3 !text-[1.25rem]">{phase.phase}</h3>
              <ul className="mt-4 text-[15px]">
                {phase.items.map((it) => (
                  <li key={it.what} className="border-t border-rule py-2.5">
                    <span className="block font-normal text-coal">{it.what}</span>
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
        <p className="mt-6 text-center text-[16px]">
          Decisions are released <span className="font-medium">{recruiting.decisions}</span>.
        </p>
      </Section>

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <figure>
            <blockquote className="font-serif text-[clamp(1.4rem,2.4vw,1.9rem)] leading-[1.4] text-coal italic">“{alumni[0].quote}”</blockquote>
            <figcaption className="mt-6 text-[16px]">
              <span className="block font-medium text-coal">{alumni[0].name}</span>
              <span className="text-text">{alumni[0].org}</span>
            </figcaption>
          </figure>
          <div>
            <Eyebrow>Who we are</Eyebrow>
            <h2 className="t-h2 mt-4">
              Student-run. <em>Community-built.</em>
            </h2>
            <p className="t-body mt-6">
              Graphite is a student-run consulting club that provides strategic and operational advice to clients across industries. We recruit
              across all five Claremont Colleges at the start of each fall and spring semester. First-years and second-years are strongly
              encouraged to apply.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <h2 className="t-h2 mb-10 text-center">Why join Graphite?</h2>
        <div className="mx-auto max-w-5xl">
          <Accordion items={whyJoin} />
        </div>
      </Section>

      <Section>
        <p className="mx-auto max-w-3xl text-center font-serif text-[clamp(1.4rem,2.4vw,1.9rem)] leading-[1.4] text-coal">
          Consulting is a challenging, rewarding career for people who are <em>driven, analytical and passionate</em> about solving problems.
        </p>
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
          {whyConsulting.map((w) => (
            <div key={w.title} className="card p-7">
              <h3 className="t-h3 !text-[1.3rem]">{w.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed">{w.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Membership</Eyebrow>
          <h2 className="t-h2 mt-4">Becoming a Graphite member</h2>
          <p className="t-body mt-6">
            Graphite is more than a pre-professional club. It is a collaborative, fun and supportive community across the Claremont Consortium, where
            you will sharpen your consulting skills and grow personally and professionally.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {member.map((m) => (
            <article key={m.title} className="card overflow-hidden">
              <div className="relative aspect-[16/10]">
                <Image src={m.image} alt="" fill sizes="(min-width:1024px) 24rem, 100vw" className="object-cover" style={{ objectPosition: m.position }} />
              </div>
              <div className="p-6">
                <h3 className="t-h3">{m.title}</h3>
                <p className="mt-3 text-[16px] leading-relaxed">{m.body}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Pill href="/life">Life at Graphite</Pill>
          <Pill href="/people" variant="outline">
            Meet the team
          </Pill>
        </div>
      </Section>

      <Section>
        <Testimonials items={alumni.slice(1)} title="From our alumni" />
      </Section>

      <Section className="!pt-0">
        <Closing title={<>Questions about <em>recruiting?</em></>} body={`Email ${recruiting.contact.name}, ${recruiting.contact.title}.`}>
          <Pill href={`mailto:${recruiting.contact.email}`} variant="outline">
            Email {recruiting.contact.name.split(" ")[0]}
          </Pill>
        </Closing>
      </Section>
    </>
  );
}
