"use client";

import { useState } from "react";
import { CaseCard } from "./blocks";
import { useSiteContent } from "@/lib/use-site-content";

const filters = ["All", "Strategy", "Digital"] as const;

export function CaseIndex() {
  const { caseStudies } = useSiteContent();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const items = caseStudies.filter((c) => filter === "All" || c.practice === filter);

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="wrap">
        <div className="flex gap-8 border-b border-line" role="tablist" aria-label="Filter by practice">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`relative pb-4 text-sm font-semibold transition-colors ${
                filter === f ? "text-highlight" : "text-slate hover:text-ink"
              }`}
            >
              {f === "All" ? "All work" : `Graphite ${f}`}
              {filter === f && <span className="absolute inset-x-0 -bottom-px h-[3px] bg-highlight" />}
            </button>
          ))}
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <CaseCard key={c.client} c={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
