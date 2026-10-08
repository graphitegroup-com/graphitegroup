"use client";

import { Band, CaseGrid, GradTitle, PhotoHero, Pill, PracticeCards, Section, StatBoxes, TextImage } from "../gg";
import { engagement } from "@/content/site";
import { useSiteContent } from "@/lib/use-site-content";

export function ClientsView() {
  const { caseStudies } = useSiteContent();
  return (
    <>
      <PhotoHero
        image="/images/kravis-building.jpg"
        position="50% 55%"
        align="center"
        height="h-[460px] md:h-[540px]"
        title={
          <>
            Small Organization.
            <br />
            Big Impact.
          </>
        }
      />

      <Section>
        <TextImage title="A Diverse Toolset" image="/images/friends-stairs.jpg" position="50% 30%" actions={<Pill href="/contact">Start a project</Pill>}>
          <p>
            Since 2018, our consultants have completed 77 projects, from pre-revenue healthcare startups to
            a Fortune 500 technology company. Our team is selected from a highly competitive pool across the Claremont
            Colleges and brings expertise in computer science, political science, economics, data science and more.
          </p>
          <p>
            Projects run one semester (about 12 weeks) or two (about 24), staffed with four to five consultants and a
            project lead who manages all communication and project work. We staff fall projects in July and spring projects
            in December.
          </p>
          <div className="pt-4">
            <StatBoxes
              items={[
                { value: "5", label: "Colleges" },
                { value: "77", label: "Projects completed" },
                { value: "9", label: "Sectors served" },
              ]}
            />
          </div>
        </TextImage>
      </Section>

      <Band>
        <h2 className="t-h2">Project Examples</h2>
        <div className="mt-12">
          <CaseGrid items={caseStudies.slice(0, 4)} />
        </div>
        <div className="mt-12 text-center">
          <Pill href="/work" variant="band">
            All case studies
          </Pill>
        </div>
      </Band>

      <Section>
        <GradTitle className="t-h2">How an Engagement Works</GradTitle>
        <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {engagement.map((e, i) => (
            <li key={e.step} className="card-glow rounded-[6px] bg-white p-7">
              <span className="flex h-[46px] w-[46px] items-center justify-center rounded-lg border border-line text-lg font-semibold text-prussian">{i + 1}</span>
              <h3 className="t-h4 mt-6">{e.title}</h3>
              <p className="t-body mt-3 text-[15px]">{e.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section className="!pt-0">
        <GradTitle className="t-h2">Our Areas of Practice</GradTitle>
        <div className="mt-14">
          <PracticeCards
            items={[
              {
                title: "Graphite Strategy",
                body: "Market entry and positioning, pricing and go-to-market, customer engagement and cost optimization.",
                href: "/work/strategy",
                cta: "About Strategy",
                image: "/images/practice-strategy.jpg",
                position: "45% 35%",
                icon: "target",
              },
              {
                title: "Graphite Digital",
                body: "Product design and UX, application development, data strategy, AI deployment and emerging technology research.",
                href: "/work/digital",
                cta: "About Digital",
                image: "/images/practice-digital.jpg",
                icon: "arrows",
              },
            ]}
          />
        </div>
      </Section>
    </>
  );
}
