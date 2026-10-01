import type { Metadata } from "next";
import Image from "next/image";
import { Reveal, SplitHeading } from "@/components/motion";
import { TeamGrid } from "@/components/team-grid";
import { team } from "@/content/team";

export const metadata: Metadata = {
  title: "Our Team",
  description: "The students running Graphite Group across the five Claremont Colleges.",
};

export default function TeamPage() {
  const total = team.reduce((n, g) => n + g.members.length, 0);
  return (
    <>
      <section className="bg-grid-paper bg-paper pt-36 pb-16 md:pt-48">
        <div className="container-page grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="eyebrow text-graphite-500">Meet the team · {total} members</p>
            <SplitHeading
              as="h1"
              immediate
              delay={0.1}
              text="Five colleges. *One* bench."
              className="mt-6 text-[clamp(2.9rem,8vw,8rem)] leading-[0.92] font-semibold tracking-[-0.05em]"
            />
          </div>
          <Reveal className="md:col-span-4">
            <p className="text-lg leading-relaxed text-graphite-600">
              A dynamic group of students from across the Claremont Colleges, passionate about innovation and real-world
              impact.
            </p>
          </Reveal>
        </div>
        <Reveal className="container-page mt-16">
          <div className="relative aspect-[16/7] overflow-hidden rounded-[28px]">
            <Image src="/images/group-stairs.jpg" alt="Graphite Group on the Kravis Center stairs" fill priority sizes="100vw" className="object-cover object-[50%_30%]" />
          </div>
        </Reveal>
      </section>

      {team.map((g, i) => (
        <section key={g.group} className="bg-paper py-12 md:py-16">
          <div className="container-page">
            <div className="mb-6 flex items-baseline justify-between border-b border-ink/10 pb-4">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{g.group}</h2>
              <span className="font-mono text-sm text-graphite-500">{String(g.members.length).padStart(2, "0")}</span>
            </div>
            <TeamGrid members={g.members} featured={i === 0} />
          </div>
        </section>
      ))}
      <div className="bg-paper pb-24" />
    </>
  );
}
