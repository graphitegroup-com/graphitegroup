"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { PageIntro, Quote, Section, WorkIndex } from "../editorial";
import { digitalArchive } from "@/content/site";
import { useSiteContent } from "@/lib/use-site-content";

const filters = ["All", "Strategy", "Digital"] as const;

export function WorkPageView() {
  const { caseStudies, testimonials } = useSiteContent();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const items = caseStudies.filter((c) => filter === "All" || c.practice === filter);

  return (
    <>
      <PageIntro
        title="Our work"
        intro="77 engagements across nine sectors since 2018. A selection is below; many clients ask us to keep their work confidential."
      />

      <section className="wrap pb-24">
        <div className="mb-6 flex gap-6 text-[0.9375rem]" role="group" aria-label="Filter by practice">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={filter === f ? "text-ink underline decoration-1 underline-offset-[0.45em]" : "text-muted hover:text-ink"}
            >
              {f === "All" ? "All work" : f}
            </button>
          ))}
        </div>
        <WorkIndex items={items} />
        <p className="mt-6 text-sm text-muted">Select an engagement to read the summary and result.</p>
      </section>

      <Section heading="Graphite Digital, earlier projects" tone="stone">
        <ul className="border-t border-ink">
          {digitalArchive.map((d) => (
            <li key={d.client} className="grid gap-1 border-b border-line py-5 md:grid-cols-12 md:gap-6">
              <span className="text-sm text-muted md:col-span-1">{d.year}</span>
              <span className="font-medium md:col-span-4">{d.client}</span>
              <span className="text-ink-2 md:col-span-7">{d.work}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section heading="What clients say">
        <div className="grid gap-x-12 gap-y-16 md:grid-cols-2">
          {testimonials.map((t) => (
            <Quote key={t.org} {...t} />
          ))}
        </div>
      </Section>

      <section className="border-t border-line">
        <div className="wrap flex flex-col justify-between gap-8 py-20 md:flex-row md:items-end">
          <p className="display max-w-2xl text-display-m">Your organization could be engagement 78.</p>
          <Link href="/contact" className="cta text-lg">
            Start a project
          </Link>
        </div>
      </section>
    </>
  );
}
