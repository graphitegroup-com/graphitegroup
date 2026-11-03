"use client";

import { useMemo, useState } from "react";
import Link from "@/components/app-link";
import { ArchiveList, CaseRows, Closing, PageHeader, Pill, Section, Testimonials } from "../gg";
import { digitalArchive } from "@/content/site";
import { useSiteContent } from "@/lib/use-site-content";

const PRACTICES = ["Strategy", "Digital"] as const;
const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "client", label: "Client name" },
  { value: "practice", label: "Practice" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    // clear-both: the legend floats (to escape the fieldset border) and flex rows would otherwise sit beside it.
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[15px] leading-snug clear-both">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-[18px] w-[18px] shrink-0 accent-[var(--color-prussian)]" />
      {label}
    </label>
  );
}

/** "All" is checked while nothing specific is; picking items narrows the list. */
function FilterGroup({ title, all, options, picked, setPicked }: { title: string; all: string; options: readonly string[]; picked: Set<string>; setPicked: (s: Set<string>) => void }) {
  const toggle = (o: string) => {
    const next = new Set(picked);
    if (next.has(o)) next.delete(o);
    else next.add(o);
    setPicked(next);
  };
  return (
    <fieldset className="border-t border-rule pt-4 first:border-0 first:pt-0">
      <legend className="float-left mb-2 w-full text-[15px] font-medium text-coal">{title}</legend>
      <Check label={all} checked={picked.size === 0} onChange={() => setPicked(new Set())} />
      {options.map((o) => (
        <Check key={o} label={o} checked={picked.has(o)} onChange={() => toggle(o)} />
      ))}
    </fieldset>
  );
}

export function WorkPageView() {
  const { caseStudies, testimonials } = useSiteContent();
  const [query, setQuery] = useState("");
  const [practices, setPractices] = useState<Set<string>>(new Set());
  const [sectors, setSectors] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<Sort>("featured");

  const sectorOptions = useMemo(() => [...new Set(caseStudies.map((c) => c.sector))].sort((a, b) => a.localeCompare(b)), [caseStudies]);

  const q = query.trim().toLowerCase();
  const items = caseStudies
    .filter((c) => (!practices.size || practices.has(c.practice)) && (!sectors.size || sectors.has(c.sector)))
    .filter((c) => !q || [c.client, c.title, c.sector, c.summary, c.outcome].some((s) => s.toLowerCase().includes(q)))
    .sort((a, b) => (sort === "client" ? a.client.localeCompare(b.client) : sort === "practice" ? a.practice.localeCompare(b.practice) : 0));

  const filters = (
    <div className="space-y-4">
      <FilterGroup title="Practice" all="All practices" options={PRACTICES} picked={practices} setPicked={setPractices} />
      <FilterGroup title="Sector" all="All sectors" options={sectorOptions} picked={sectors} setPicked={setSectors} />
    </div>
  );

  return (
    <>
      <PageHeader
        title="Our Work"
        sub={
          <p>
            77 engagements across nine sectors since 2018. Many clients ask us to keep their work confidential, so a selection is below. To start
            your own, <Link href="/contact" className="link-u">work with us</Link>.
          </p>
        }
      />

      <div className="container-gg pb-16 md:pb-24">
        <div className="mb-4 flex items-center justify-end gap-3">
          <label htmlFor="work-sort" className="text-[16px]">
            Sort by
          </label>
          <select id="work-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field !w-auto min-w-[10rem] !py-2">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[17.5rem_1fr]">
          <div className="lg:sticky lg:top-20">
            <details className="card p-5 lg:hidden">
              <summary className="cursor-pointer text-[16px] font-normal text-coal">
                Filters{practices.size + sectors.size ? ` (${practices.size + sectors.size})` : ""}
              </summary>
              <div className="mt-4">{filters}</div>
            </details>
            <div className="card hidden p-5 lg:block">{filters}</div>
          </div>

          <div className="min-w-0 space-y-5">
            <div className="card p-5">
              <label htmlFor="work-search" className="sr-only">
                Search case studies
              </label>
              <input id="work-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="field" />
            </div>
            <p className="px-1 text-[15px] text-text" aria-live="polite">
              Showing {items.length} of {caseStudies.length} {caseStudies.length === 1 ? "project" : "projects"}
            </p>
            {items.length ? (
              <CaseRows items={items} />
            ) : (
              <div className="card p-10 text-center text-[16px] text-text">No projects match these filters.</div>
            )}
          </div>
        </div>
      </div>

      <Section className="!pt-0">
        <div className="mx-auto max-w-4xl">
          <h2 className="t-h2 text-center">Previous digital projects</h2>
          <div className="mt-10">
            <ArchiveList rows={digitalArchive} />
          </div>
        </div>
      </Section>

      <Section className="!pt-0">
        <Testimonials items={testimonials} />
      </Section>

      <Section className="!pt-0">
        <Closing title={<>Have a project <em>in mind?</em></>} body="We scope every engagement with you before staffing a team.">
          <Pill href="/contact">Work with us</Pill>
        </Closing>
      </Section>
    </>
  );
}
