"use client";

import {
  GradTitle,
  PeopleGrid,
  PhotoHero,
  PhotoPillars,
  Pill,
  Section,
  StatBoxes,
  TextImage,
} from "../gg";
import { pillars } from "@/content/site";
import { useSiteContent } from "@/lib/use-site-content";

export function AboutPageView() {
  const { groups, roster, stats } = useSiteContent();
  const exec = roster.filter((m) => m.group === groups[0]);

  return (
    <>
      <PhotoHero
        image="/images/exec-stairs.jpg"
        position="50% 35%"
        align="center"
        height="h-[460px] md:h-[560px]"
        title="Liberal Arts in Action"
      />

      <Section>
        <TextImage
          title="Who We Are"
          image="/images/exec-laugh.jpg"
          position="50% 40%"
          imageHeight="h-[380px] md:h-[440px]"
        >
          <p>
            Established in 2018, Graphite Group is a Claremont-based college
            consulting club dedicated to lasting outcomes for its clients,
            members and the wider community. We give driven students the chance
            to engage deeply with business strategy, creating value for the
            startups we work with while building collaborative, career-defining
            experience.
          </p>
          <p>
            Over the years we have built a national network of clients, experts
            and alumni, and it keeps growing.
          </p>
          <div className="pt-4">
            <StatBoxes
              items={[
                {
                  value: stats[0]?.value ?? "77",
                  label: "Engagements since 2018",
                },
                {
                  value: stats[3]?.value ?? "90+",
                  label: "Members and alumni",
                },
                { value: "5", label: "Colleges" },
              ]}
            />
          </div>
        </TextImage>
      </Section>

      <PhotoPillars
        image="/images/campus-snow.jpg"
        title="Our mission"
        sub="Our work at Graphite is guided by three core pillars."
        items={pillars}
      />

      <Section>
        <TextImage
          title="Liberal Arts in Action"
          image="/images/kravis-building.jpg"
          position="50% 55%"
          actions={
            <Pill href="/contact" variant="outline">
              Work with us
            </Pill>
          }
        >
          <p>
            Graphite&apos;s mission and values are rooted in the liberal arts.
            Through classes across many disciplines, our members are prepared to
            address social, economic and cultural challenges from several
            perspectives at once.
          </p>
          <p>
            We offer clients that range of skills and worldviews, and give
            members the chance to put their education and experience to work on
            real problems.
          </p>
        </TextImage>
      </Section>

      <Section className="!pt-0">
        <TextImage
          title="The Randall Lewis Center for Innovation and Entrepreneurship"
          image="/images/campus.jpg"
          reverse
        >
          <p>
            The RLCIE is the premier entrepreneurship institute of the Claremont
            Colleges, named for businessman, visionary and philanthropist
            Randall Lewis. It supports an innovative, entrepreneurial community
            on campus through research, programming and resources for students
            and faculty.
          </p>
          <p>
            As the consulting arm of the institute, Graphite puts students on
            real business problems for real clients, developing the
            problem-solving and leadership skills the institute exists to build.
          </p>
        </TextImage>
      </Section>

      <Section className="!pt-0">
        <GradTitle className="t-h2">Executive Board</GradTitle>
        <div className="mt-12">
          <PeopleGrid people={exec} five={exec.length === 5} />
        </div>
        <div className="mt-12">
          <Pill href="/people" variant="outline">
            Meet the full team
          </Pill>
        </div>
      </Section>
    </>
  );
}
