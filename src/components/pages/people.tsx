"use client";

import { GradTitle, PeopleGrid, Pill, Section } from "../gg";
import { useSiteContent } from "@/lib/use-site-content";

export function PeopleView() {
  const { groups, roster } = useSiteContent();
  const sections = groups.map((group) => ({ group, members: roster.filter((m) => m.group === group) })).filter((g) => g.members.length);

  return (
    <>
      <Section className="!pb-6 text-center">
        <GradTitle as="h1" className="t-h1 inline-block">
          Meet the team
        </GradTitle>
        <p className="t-body mx-auto mt-5 max-w-xl">
          A dynamic group of students from across the Claremont Colleges, passionate about innovation and real-world impact.
        </p>
      </Section>

      {sections.map(({ group, members }) => (
        <Section key={group} className="!py-12 md:!py-16">
          <h2 className="mb-10 text-center text-[clamp(1.6rem,2.6vw,2.1rem)] font-semibold tracking-[-0.05em]">{group}</h2>
          <PeopleGrid people={members} />
        </Section>
      ))}

      <Section className="!pt-6 text-center">
        <GradTitle className="t-h2 inline-block">Join the next class</GradTitle>
        <div className="mt-8">
          <Pill href="/students">For students</Pill>
        </div>
      </Section>
    </>
  );
}
