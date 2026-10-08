"use client";

import { Band, GradTitle, Pill, Section, TextImage } from "../gg";
import { digitalArchive, practices } from "@/content/site";

const copy = {
  strategy: {
    title: "Reaching Strategic Goals With Graphite Strategy",
    intro: [
      "Since 2018, Graphite has worked on more than 40 strategy projects across nine sectors.",
      "Graphite consultants help clients scale and develop their businesses through comprehensive analysis, market entry strategies and research. Experience across industries and stages, together with a thoughtful internal training program, equips our consultants to deliver professional insight on unique and complex challenges.",
    ],
    image: "/images/friends-stairs.jpg",
    position: "50% 30%",
  },
  digital: {
    title: "Scaling the Digital Future of Businesses",
    intro: [
      "With technology adoption accelerating across industries, we established Graphite Digital in 2021 as a subgroup within Graphite.",
      "Graphite Digital provides UX design, software engineering and data analytics to businesses with innovative models. Our work complements, rather than replaces, R&D teams, adding a quantitative perspective to our clients' services.",
    ],
    image: "/images/exec-stairs.jpg",
    position: "50% 30%",
  },
} as const;

export function PracticeView({ slug }: { slug: "strategy" | "digital" }) {
  const p = practices.find((x) => x.slug === slug)!;
  const c = copy[slug];
  return (
    <>
      <Section>
        <TextImage
          title={c.title}
          image={c.image}
          position={c.position}
          actions={
            <>
              <Pill href="/contact">Start a project</Pill>
              <Pill href="/work" variant="outline">
                See case studies
              </Pill>
            </>
          }
        >
          {c.intro.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </TextImage>
      </Section>

      {/* The original's italic sector line. */}
      <div className="overflow-hidden border-y border-line py-6">
        <p className="grad-title text-center text-[clamp(1.1rem,2.2vw,1.6rem)] font-medium tracking-[-0.03em] whitespace-nowrap uppercase italic">
          {p.sectors.join(", ")}
        </p>
      </div>

      <Band>
        <h2 className="t-h2 max-w-2xl">What we do</h2>
        <div className="mt-14 grid gap-x-16 gap-y-12 md:grid-cols-2">
          {p.services.map((s) => (
            <div key={s.title} className="border-t border-band-line pt-6">
              <h3 className="t-h4">{s.title}</h3>
              <p className="mt-3 text-[17px] text-band-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </Band>

      {slug === "digital" && (
        <Section>
          <GradTitle className="t-h2 text-center">Previous Project Examples</GradTitle>
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
      )}

      <Section className={slug === "digital" ? "!pt-0" : ""}>
        <div className="flex flex-col items-center gap-6 text-center">
          <GradTitle className="t-h2">Have a project in mind?</GradTitle>
          <p className="t-body max-w-xl">We scope every engagement with you before staffing a team. Fall projects are staffed in July and spring projects in December.</p>
          <Pill href="/contact">Work with us</Pill>
        </div>
      </Section>
    </>
  );
}
