"use client";

import { Closing, PageHeader, PersonRows, Pill, Section } from "../gg";
import { useSiteContent } from "@/lib/use-site-content";

export function PeopleView() {
  const { groups, roster } = useSiteContent();
  const sections = groups.map((group) => ({ group, members: roster.filter((m) => m.group === group) })).filter((g) => g.members.length);

  return (
    <>
      <PageHeader title="Our Team" sub="Students from across the Claremont Colleges, passionate about innovation and real-world impact." />

      <div className="container-gg container-narrow space-y-16 pb-8 md:space-y-20">
        {sections.map(({ group, members }) => {
          const id = `group-${group.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          return (
          <section key={group} aria-labelledby={id}>
            <h2 id={id} className="t-sub mb-8">
              {group}
            </h2>
            <PersonRows people={members} />
          </section>
          );
        })}
      </div>

      <Section>
        <Closing
          title={
            <>
              Join the <em>next class</em>
            </>
          }
          body="We recruit across all five Claremont Colleges at the start of each fall and spring semester."
        >
          <Pill href="/students">For students</Pill>
        </Closing>
      </Section>
    </>
  );
}
