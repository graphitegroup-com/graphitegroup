"use client";

import { FadeIn } from "./motion";
import { useSiteContent } from "@/lib/use-site-content";

export function StatsRow() {
  const { stats } = useSiteContent();
  return (
    <section className="border-y border-line bg-white py-16 md:py-20">
      <div className="wrap">
        <h2 className="h-section text-center">Graphite Group by the numbers</h2>
        <dl className="mt-12 grid grid-cols-2 gap-y-10 md:grid-cols-4">
          {stats.map((s, i) => (
            <FadeIn
              key={s.label}
              delay={i * 0.05}
              className={`px-4 text-center md:px-8 ${i > 0 ? "md:border-l md:border-line" : ""}`}
            >
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-serif text-5xl text-highlight md:text-6xl">{s.value}</dd>
              <dd className="mx-auto mt-3 max-w-[14rem] text-sm leading-relaxed text-slate">{s.label}</dd>
            </FadeIn>
          ))}
        </dl>
      </div>
    </section>
  );
}
