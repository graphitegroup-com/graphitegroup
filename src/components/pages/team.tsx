"use client";

import Image from "next/image";
import { CareersBand, PageHeader } from "../blocks";
import type { PublicMember } from "@/lib/site-content";
import { useSiteContent } from "@/lib/use-site-content";

function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
}

function Person({ m }: { m: PublicMember }) {
  return (
    <li>
      <div className="relative aspect-[4/5] overflow-hidden bg-cloud">
        {m.photo ? (
          <Image src={m.photo} alt={m.name} fill sizes="(min-width:1024px) 20vw, 50vw" className="object-cover" />
        ) : (
          <span aria-hidden className="absolute inset-0 flex items-center justify-center font-serif text-5xl text-mist">
            {initials(m.name)}
          </span>
        )}
      </div>
      <p className="mt-4 font-semibold">{m.name}</p>
      <p className="mt-0.5 text-sm text-slate">{m.role}</p>
    </li>
  );
}

export function TeamPageView() {
  const { groups, roster } = useSiteContent();
  const team = groups
    .map((group) => ({ group, members: roster.filter((m) => m.group === group) }))
    .filter((g) => g.members.length > 0);
  return (
    <>
      <PageHeader
        crumb="Our People"
        title="Our people"
        intro="Graphite is run entirely by students from Pomona, Claremont McKenna, Harvey Mudd, Scripps and Pitzer."
        image="/images/group-stairs.jpg"
        imageAlt="Graphite Group on the Kravis Center stairs"
        imagePosition="50% 30%"
      />
      {team.map((g, i) => (
        <section key={g.group} className={`bg-white py-16 md:py-20 ${i > 0 ? "border-t border-line" : ""}`}>
          <div className="wrap">
            <h2 className="h-section">{g.group}</h2>
            <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
              {g.members.map((m) => (
                <Person key={m.id} m={m} />
              ))}
            </ul>
          </div>
        </section>
      ))}
      <CareersBand />
    </>
  );
}
