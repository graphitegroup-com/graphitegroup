"use client";

import Link from "@/components/app-link";
import { ArchiveList, Breadcrumbs, Chip, Closing, FactCard, Pill, Section } from "../gg";
import { MarkTile } from "../mark";
import { digitalArchive, practices } from "@/content/site";

const copy = {
  strategy: {
    title: "Reaching strategic goals with Graphite Strategy",
    intro: [
      "Since 2018, Graphite has worked on more than 40 strategy projects across nine sectors.",
      "Graphite consultants help clients scale and develop their businesses through comprehensive analysis, market entry strategies and research. Experience across industries and stages, together with a thoughtful internal training program, equips our consultants to deliver professional insight on unique and complex challenges.",
    ],
    image: "/images/friends-stairs.jpg",
    position: "50% 30%",
    facts: [
      ["Founded", "2018"],
      ["Projects", "40+"],
      ["Sectors", "9"],
      ["Team", "Lead and 4 to 5 consultants"],
      ["Length", "12 or 24 weeks"],
    ],
  },
  digital: {
    title: "Scaling the digital future of businesses",
    intro: [
      "With technology adoption accelerating across industries, we established Graphite Digital in 2021 as a subgroup within Graphite.",
      "Graphite Digital provides UX design, software engineering and data analytics to businesses with innovative models. Our work complements, rather than replaces, R&D teams, adding a quantitative perspective to our clients' services.",
    ],
    image: "/images/exec-stairs.jpg",
    position: "50% 30%",
    facts: [
      ["Founded", "2021"],
      ["Focus", "Product, data, AI"],
      ["Team", "Lead and 4 to 5 consultants"],
      ["Length", "12 or 24 weeks"],
      ["Staffed", "July and December"],
    ],
  },
} as const;

export function PracticeView({ slug }: { slug: "strategy" | "digital" }) {
  const p = practices.find((x) => x.slug === slug)!;
  const c = copy[slug];
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "services", label: "Services" },
    ...(slug === "digital" ? [{ id: "projects", label: "Projects" }] : []),
  ];

  return (
    <>
      <div className="container-gg pt-8 pb-16 md:pt-10 md:pb-24">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/work", label: "Our Work" }, { label: p.name }]} />

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_19rem] lg:gap-12">
          <div className="min-w-0">
            <header className="flex gap-5">
              <MarkTile size={64} className="rounded-[6px]" />
              <div className="min-w-0">
                <h1 className="text-[clamp(1.6rem,2.6vw,1.9rem)] leading-tight font-normal text-coal">{p.name}</h1>
                <p className="mt-1 text-[18px] leading-snug">{p.summary}</p>
                <p className="mt-3 flex flex-wrap gap-1.5">
                  {p.kicker.split(", ").map((k) => (
                    <Chip key={k}>{k}</Chip>
                  ))}
                </p>
              </div>
            </header>

            {/* In-page tabs, as on a YC company page. */}
            <nav aria-label="Sections" className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-2 border-y border-rule px-3 py-4 text-[16px]">
              {tabs.map((t, i) => (
                <a key={t.id} href={`#${t.id}`} className={i === 0 ? "font-medium text-coal" : "font-normal text-coal/75 hover:text-coal"}>
                  {t.label}
                </a>
              ))}
              <Link href="/contact" className="link-c ml-auto font-normal">
                Start a project
              </Link>
            </nav>

            <section id="overview" className="scroll-mt-24 px-1 pt-8 md:px-4">
              <h2 className="t-h3">{c.title}</h2>
              <div className="t-body mt-4 space-y-4">
                <p>{p.long}</p>
                <p>{c.intro[1]}</p>
              </div>
              <p className="mt-6 flex flex-wrap gap-1.5" aria-label="Sectors">
                {p.sectors.map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </p>
            </section>

            <section id="services" className="scroll-mt-24 px-1 pt-14 md:px-4">
              <h2 className="text-[clamp(1.4rem,2vw,1.6rem)] font-medium text-coal">What we do</h2>
              <ul className="mt-6 space-y-4">
                {p.services.map((s) => (
                  <li key={s.title} className="card px-6 py-5">
                    <h3 className="text-[19px] font-medium text-coal">{s.title}</h3>
                    <p className="mt-1 text-[16px] leading-relaxed">{s.body}</p>
                  </li>
                ))}
              </ul>
            </section>

            {slug === "digital" && (
              <section id="projects" className="scroll-mt-24 px-1 pt-14 md:px-4">
                <h2 className="text-[clamp(1.4rem,2vw,1.6rem)] font-medium text-coal">Previous projects</h2>
                <div className="mt-6">
                  <ArchiveList rows={digitalArchive} />
                </div>
              </section>
            )}
          </div>

          <div className="lg:sticky lg:top-24">
            <FactCard title={p.name} image={{ src: c.image, position: c.position }} rows={c.facts.map(([k, v]) => [k, v])}>
              <Pill href="/contact" small>
                Start a project
              </Pill>
              <Pill href="/work" variant="outline" small>
                Case studies
              </Pill>
            </FactCard>
          </div>
        </div>
      </div>

      <Section className="!pt-0">
        <Closing
          title={
            <>
              Have a project <em>in mind?</em>
            </>
          }
          body="We scope every engagement with you before staffing a team. Fall projects are staffed in July and spring projects in December."
        >
          <Pill href="/contact">Work with us</Pill>
        </Closing>
      </Section>
    </>
  );
}
