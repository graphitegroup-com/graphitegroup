"use client";

import { Band, FocusItems, GradTitle, PhotoHero, Pill, PracticeCards, Section, StatsMap, Testimonials, TextImage } from "../gg";
import { useSiteContent } from "@/lib/use-site-content";

export function HomeView() {
  const { stats, testimonials } = useSiteContent();

  return (
    <>
      <PhotoHero
        image="/images/group-lawn.jpg"
        title={
          <>
            Graphite
            <br />
            Group
          </>
        }
        sub="Small organization. Big impact."
      />

      <Section>
        <TextImage
          title="Graphite Group focuses on innovation, entrepreneurship, and transformation."
          image="/images/group-stairs.jpg"
          imageAlt="Graphite Group on the Kravis Center stairs"
          position="50% 25%"
          actions={
            <>
              <Pill href="/contact">Work with us</Pill>
              <Pill href="/students" variant="outline">
                For students
              </Pill>
            </>
          }
        >
          <p>
            Graphite Group is a student-run consulting group based at the Claremont Colleges. Since our founding, we have
            completed 77 projects across nine sectors, helping businesses in fintech, healthcare, cloud computing and real
            estate reach their strategic goals.
          </p>
          <p>
            Our consultants come from five liberal arts colleges, with expertise in economics, data science, engineering,
            public policy and more.
          </p>
        </TextImage>
      </Section>

      <Band>
        <StatsMap
          heading="Our objective is to provide our clients and the greater community with positive progress and long-lasting results."
          stats={stats.slice(0, 3).map((s, i) => ({ value: s.value, label: ["Completed projects", "Different sectors", "Colleges spanned"][i] ?? s.label }))}
        />
        <GradTitle onBand className="t-h2 mt-28 mb-16 text-center md:mt-[130px]">
          Our Focus
        </GradTitle>
        <FocusItems
          items={[
            {
              icon: "arrow",
              title: "Startup focused",
              body: "Entrepreneurship drives innovation and addresses critical societal challenges. We work with founders across industries to reach their strategic goals and accelerate their path to growth.",
            },
            {
              icon: "lines",
              title: "Student run",
              body: "Every engagement is staffed by students from all five colleges and led by an experienced project lead. We value the outcome of a task more than the method used to reach it.",
            },
          ]}
        />
        <div className="mt-20 text-center">
          <Pill href="/students" variant="band">
            For students
          </Pill>
        </div>
      </Band>

      <Section>
        <GradTitle className="t-h2">Our Areas of Practice</GradTitle>
        <div className="mt-16">
          <PracticeCards
            items={[
              {
                title: "Graphite Strategy",
                body: "Our strategy consulting practice, for businesses with needs in market entry and positioning, pricing and go-to-market, and cost optimization.",
                href: "/work/strategy",
                cta: "About Strategy",
                image: "/images/practice-strategy.jpg",
                position: "45% 35%",
                icon: "target",
              },
              {
                title: "Graphite Digital",
                body: "Our digital consulting and implementation practice, for businesses with needs in software development, engineering, data analytics and product design.",
                href: "/work/digital",
                cta: "About Digital",
                image: "/images/practice-digital.jpg",
                position: "50% 30%",
                icon: "arrows",
              },
            ]}
          />
        </div>
      </Section>

      <Section className="!pt-4">
        <Testimonials items={testimonials} />
      </Section>
    </>
  );
}
