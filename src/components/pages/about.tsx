"use client";

import Link from "@/components/app-link";
import { Figures, PageIntro, Photo, Section } from "../editorial";
import { colleges, pillars } from "@/content/site";
import { useSiteContent } from "@/lib/use-site-content";

export function AboutPageView() {
  const { groups, roster, stats } = useSiteContent();
  const exec = roster.filter((m) => m.group === groups[0]);

  return (
    <>
      <PageIntro
        title="About Graphite"
        intro="Established in 2018, Graphite Group is a Claremont-based consulting group dedicated to lasting outcomes for its clients, its members and the wider community."
      />
      <div className="wrap">
        <Photo src="/images/campus.jpg" alt="The Claremont Colleges with the San Gabriel Mountains" caption="The Claremont Colleges." ratio="aspect-[16/9] md:aspect-[21/9]" priority />
      </div>

      <Section heading="Liberal arts in action">
        <p className="display max-w-3xl text-display-m">
          Clients get several perspectives on a single question. Members put their education to work on real problems.
        </p>
        <div className="mt-8 max-w-2xl space-y-5 leading-relaxed text-ink-2">
          <p>
            Our members study across disciplines at {colleges.slice(0, -1).join(", ")} and {colleges.at(-1)}: economics,
            computer science, data science, engineering, public policy and more.
          </p>
          <p>Over the years we have built a national network of clients, experts and alumni, and it grows with every class.</p>
        </div>
      </Section>

      <Section heading="What guides us" tone="stone">
        <dl className="border-t border-ink">
          {pillars.map((p) => (
            <div key={p.title} className="grid gap-2 border-b border-line py-6 md:grid-cols-9 md:gap-6">
              <dt className="display text-display-s md:col-span-3">{p.title}</dt>
              <dd className="leading-relaxed text-ink-2 md:col-span-6">{p.body}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section heading="Institutional partner">
        <p className="display max-w-3xl text-display-m">The consulting arm of the Randall Lewis Center for Innovation & Entrepreneurship.</p>
        <p className="mt-6 max-w-2xl leading-relaxed text-ink-2">
          The RLCIE is the premier entrepreneurship institute of the Claremont Colleges. Graphite carries its mission into the
          field, putting students on real business problems for real clients.
        </p>
      </Section>

      <Section heading="In numbers" tone="night">
        <Figures items={stats} dark />
      </Section>

      <Section heading="Leadership">
        <ul className="border-t border-ink">
          {exec.map((m) => (
            <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-x-6 border-b border-line py-4">
              <span className="display text-display-s">{m.name}</span>
              <span className="text-muted">{m.role}</span>
            </li>
          ))}
        </ul>
        <Link href="/people" className="cta mt-10">
          Everyone at Graphite
        </Link>
      </Section>
    </>
  );
}
