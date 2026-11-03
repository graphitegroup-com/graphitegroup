"use client";

import { ClientShowcase, Eyebrow, Photo, Pill, PracticeCards, Section, StatRow, Testimonials } from "../gg";
import { practices } from "@/content/site";
import { useSiteContent } from "@/lib/use-site-content";

export function HomeView() {
  const { stats, testimonials, caseStudies } = useSiteContent();
  const footnote = testimonials[0];

  return (
    <>
      {/* Hero: one serif line with a footnoted client quote, after ycombinator.com. */}
      <header className="container-gg relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center pt-10 pb-24 text-center">
        <h1 className="t-hero">
          Small organization.
          <br />
          <em>Big impact.</em>
          {footnote && (
            <sup className="ml-1 align-super text-[clamp(0.95rem,1.4vw,1.2rem)] font-normal tracking-normal not-italic">
              <a href="#footnote" aria-label="Footnote 1">
                [1]
              </a>
            </sup>
          )}
        </h1>
        {footnote && (
          <figure id="footnote" className="mt-12 max-w-[27rem] text-left font-serif text-[17px] leading-[1.7] text-coal">
            <blockquote className="italic">
              <span className="not-italic">[1] </span>“{footnote.quote}”
            </blockquote>
            <figcaption className="mt-3 text-right italic">
              {footnote.name}, {footnote.org}
            </figcaption>
          </figure>
        )}
        <a href="#intro" aria-label="Scroll to the introduction" className="absolute bottom-8 left-1/2 -translate-x-1/2 p-2 text-coal/70 hover:text-coal">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M3.5 6 8 10.5 12.5 6" />
          </svg>
        </a>
      </header>

      <Section id="intro">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <Eyebrow>Who we are</Eyebrow>
            <h2 className="t-h2 mt-4 max-w-xl">
              Graphite Group focuses on innovation, entrepreneurship, and <em>transformation.</em>
            </h2>
            <div className="t-body mt-6 max-w-xl space-y-4">
              <p>
                Graphite Group is a student-run consulting group based at the Claremont Colleges. Since our founding, we have completed 77 projects
                across nine sectors, helping businesses in fintech, healthcare, cloud computing and real estate reach their strategic goals.
              </p>
              <p>
                Our consultants come from five liberal arts colleges, with expertise in economics, data science, engineering, public policy and
                more.
              </p>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Pill href="/contact">Work with us</Pill>
              <Pill href="/students" variant="outline">
                For students
              </Pill>
            </div>
          </div>
          <Photo src="/images/group-stairs.jpg" alt="Graphite Group on the Kravis Center stairs" position="50% 25%" className="aspect-[4/3]" priority />
        </div>
      </Section>

      <Section className="!pt-4">
        <p className="mx-auto mb-12 max-w-3xl text-center font-serif text-[clamp(1.4rem,2.4vw,1.9rem)] leading-[1.4] text-coal">
          Our objective is to provide our clients and the greater community with <em>positive progress</em> and long-lasting results.
        </p>
        <StatRow
          items={stats.slice(0, 4).map((s, i) => ({
            value: s.value,
            label: ["Completed projects", "Different sectors", "Colleges spanned", "Members and alumni"][i] ?? s.label,
          }))}
        />
      </Section>

      <Section>
        <div className="mb-12 text-center">
          <Eyebrow>Selected work</Eyebrow>
          <h2 className="t-h2 mt-4">Clients we have worked with</h2>
        </div>
        <ClientShowcase items={caseStudies} />
        <div className="mt-12 text-center">
          <Pill href="/work" variant="outline" small>
            All case studies
          </Pill>
        </div>
      </Section>

      <Section>
        <div className="mb-12 text-center">
          <Eyebrow>Our focus</Eyebrow>
          <h2 className="t-h2 mt-4">Startup focused. Student run.</h2>
        </div>
        <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-2 md:gap-14">
          <div>
            <h3 className="t-h3">Startup focused</h3>
            <p className="t-body mt-3">
              Entrepreneurship drives innovation and addresses critical societal challenges. We work with founders across industries to reach
              their strategic goals and accelerate their path to growth.
            </p>
          </div>
          <div>
            <h3 className="t-h3">Student run</h3>
            <p className="t-body mt-3">
              Every engagement is staffed by students from all five colleges and led by an experienced project lead. We value the outcome of a
              task more than the method used to reach it.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="mb-12 text-center">
          <Eyebrow>Areas of practice</Eyebrow>
          <h2 className="t-h2 mt-4">Two practices, one standard</h2>
        </div>
        <PracticeCards
          items={[
            {
              title: "Graphite Strategy",
              body: "Our strategy consulting practice, for businesses with needs in market entry and positioning, pricing and go-to-market, and cost optimization.",
              href: "/work/strategy",
              cta: "About Strategy",
              image: "/images/practice-strategy.jpg",
              position: "45% 35%",
              tags: practices[0].kicker.split(", "),
            },
            {
              title: "Graphite Digital",
              body: "Our digital consulting and implementation practice, for businesses with needs in software development, engineering, data analytics and product design.",
              href: "/work/digital",
              cta: "About Digital",
              image: "/images/practice-digital.jpg",
              position: "50% 30%",
              tags: practices[1].kicker.split(", "),
            },
          ]}
        />
      </Section>

      <Section>
        <Testimonials items={testimonials} />
      </Section>
    </>
  );
}
