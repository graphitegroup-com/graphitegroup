"use client";

import { useState } from "react";
import { Band, CaseGrid, GradTitle, PhotoHero, Pill, Section, Testimonials } from "../gg";
import { digitalArchive } from "@/content/site";
import { useSiteContent } from "@/lib/use-site-content";

const filters = ["All", "Strategy", "Digital"] as const;

export function WorkPageView() {
  const { caseStudies, testimonials } = useSiteContent();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const items = caseStudies.filter((c) => filter === "All" || c.practice === filter);

  return (
    <>
      <PhotoHero image="/images/group-stairs.jpg" position="50% 30%" align="center" height="h-[420px] md:h-[480px]" title="Our Work" />

      <Band>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="t-h2">Project Examples</h2>
            <p className="mt-4 max-w-xl text-band-muted">
              77 engagements across nine sectors since 2018. A selection is below; many clients ask us to keep their work
              confidential.
            </p>
          </div>
          <div className="flex gap-2" role="group" aria-label="Filter by practice">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-5 py-2.5 text-[15px] transition-colors ${
                  filter === f ? "border-band-fg bg-band-fg text-band" : "border-band-line hover:border-band-fg"
                }`}
              >
                {f === "All" ? "All work" : f}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-12">
          <CaseGrid items={items} />
        </div>
      </Band>

      <Section>
        <GradTitle className="t-h2 text-center">Previous Digital Projects</GradTitle>
        <div className="mx-auto mt-12 max-w-4xl overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-[15px]">
            <tbody>
              {digitalArchive.map((d) => (
                <tr key={d.client} className="border-b border-line align-top">
                  <td className="w-20 py-4 pr-4 text-text">{d.year}</td>
                  <td className="w-1/3 py-4 pr-6 font-semibold">{d.client}</td>
                  <td className="py-4 text-text">{d.work}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section className="!pt-4">
        <Testimonials items={testimonials} />
        <div className="mt-14 text-center">
          <Pill href="/contact">Work with us</Pill>
        </div>
      </Section>
    </>
  );
}
