"use client";

import { CaseRows, Closing, Eyebrow, PageHeader, Photo, Pill, PracticeCards, Section, StatRow } from "../gg";
import { engagement, practices } from "@/content/site";
import { useSiteContent } from "@/lib/use-site-content";

export function ClientsView() {
  const { caseStudies } = useSiteContent();
  return (
    <>
      <PageHeader
        title={
          <>
            Small organization. <em>Big impact.</em>
          </>
        }
        sub="Strategy and digital work for startups, institutions and Fortune 500 teams, staffed by students from all five Claremont Colleges."
      >
        <Pill href="/contact">Start a project</Pill>
        <Pill href="/work" variant="outline">
          See our work
        </Pill>
      </PageHeader>

      <Section className="!pt-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <Eyebrow>A diverse toolset</Eyebrow>
            <h2 className="t-h2 mt-4">
              From pre-revenue startups to the <em>Fortune 500</em>
            </h2>
            <div className="t-body mt-6 space-y-4">
              <p>
                Since 2018, our consultants have completed 77 projects, from pre-revenue healthcare startups to a Fortune 500 technology company. Our
                team is selected from a highly competitive pool across the Claremont Colleges and brings expertise in computer science, political
                science, economics, data science and more.
              </p>
              <p>
                Projects run one semester (about 12 weeks) or two (about 24), staffed with four to five consultants and a project lead who manages all
                communication and project work. We staff fall projects in July and spring projects in December.
              </p>
            </div>
          </div>
          <Photo src="/images/friends-stairs.jpg" alt="Graphite consultants on the stairs" position="50% 30%" className="aspect-[4/3]" priority />
        </div>
        <div className="mt-16">
          <StatRow
            items={[
              { value: "5", label: "Colleges" },
              { value: "77", label: "Projects completed" },
              { value: "9", label: "Sectors served" },
            ]}
          />
        </div>
      </Section>

      <Section>
        <div className="mb-10 text-center">
          <Eyebrow>Project examples</Eyebrow>
          <h2 className="t-h2 mt-4">Recent engagements</h2>
        </div>
        <div className="mx-auto max-w-4xl">
          <CaseRows items={caseStudies.slice(0, 4)} />
          <div className="mt-10 text-center">
            <Pill href="/work" variant="outline" small>
              All case studies
            </Pill>
          </div>
        </div>
      </Section>

      <Section>
        <div className="mb-12 text-center">
          <Eyebrow>Process</Eyebrow>
          <h2 className="t-h2 mt-4">How an engagement works</h2>
        </div>
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {engagement.map((e) => (
            <li key={e.step} className="card p-6">
              <span className="t-num !text-[2.75rem] text-prussian">{e.step}</span>
              <h3 className="t-h3 mt-5">{e.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed">{e.body}</p>
            </li>
          ))}
        </ol>
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
              body: "Market entry and positioning, pricing and go-to-market, customer engagement and cost optimization.",
              href: "/work/strategy",
              cta: "About Strategy",
              image: "/images/practice-strategy.jpg",
              position: "45% 35%",
              tags: practices[0].kicker.split(", "),
            },
            {
              title: "Graphite Digital",
              body: "Product design and UX, application development, data strategy, AI deployment and emerging technology research.",
              href: "/work/digital",
              cta: "About Digital",
              image: "/images/practice-digital.jpg",
              tags: practices[1].kicker.split(", "),
            },
          ]}
        />
      </Section>

      <Section className="!pt-4">
        <Closing
          title={
            <>
              Have a question <em>worth answering?</em>
            </>
          }
          body="Tell us about your organization and the problem you are working on. A member of our leadership team will reply within a few business days."
        >
          <Pill href="/contact">Work with us</Pill>
        </Closing>
      </Section>
    </>
  );
}
