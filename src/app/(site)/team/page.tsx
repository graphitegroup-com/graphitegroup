import type { Metadata } from "next";
import Image from "next/image";
import { CareersBand, PageHeader } from "@/components/blocks";
import { team, type Member } from "@/content/team";

export const metadata: Metadata = {
  title: "Our People",
  description: "The students leading Graphite Group across the five Claremont Colleges.",
};

function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
}

function Person({ m }: { m: Member }) {
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

export default function TeamPage() {
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
                <Person key={m.name} m={m} />
              ))}
            </ul>
          </div>
        </section>
      ))}
      <CareersBand />
    </>
  );
}
