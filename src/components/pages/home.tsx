"use client";

import Link from "@/components/app-link";
import { Figures, Photo, Quote, Section, WorkIndex } from "../editorial";
import { clients, engagement, practices } from "@/content/site";
import { useSiteContent } from "@/lib/use-site-content";

export function HomeView() {
  const { stats, caseStudies, testimonials } = useSiteContent();
  const [featured, ...more] = testimonials;

  return (
    <>
      <section className="wrap pt-14 pb-12 md:pt-24 md:pb-16">
        <h1 className="display max-w-[16ch] text-display-xl">The student consulting firm of the Claremont Colleges.</h1>
        <div className="mt-10 grid gap-8 md:grid-cols-12">
          <p className="max-w-xl text-lg leading-relaxed text-ink-2 md:col-span-7 md:text-xl">
            Since 2018, teams drawn from all five colleges have completed 77 strategy and digital engagements for startups,
            institutions and Fortune 500 companies.
          </p>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4 md:col-span-5 md:justify-end">
            <Link href="/contact" className="cta text-lg">
              Start a project
            </Link>
            <Link href="/work" className="link-u text-lg text-ink-2">
              See our work
            </Link>
          </div>
        </div>
      </section>

      <div className="wrap">
        <Photo
          src="/images/group-lawn.jpg"
          alt="Members of Graphite Group"
          caption="Graphite Group members, Claremont, California."
          ratio="aspect-[16/9] md:aspect-[21/9]"
          position="50% 42%"
          priority
        />
      </div>

      <Section heading="What we do">
        <div className="grid gap-16 md:grid-cols-2 md:gap-12">
          {practices.map((p) => (
            <div key={p.slug}>
              <h3 className="display text-display-m">{p.name}</h3>
              <p className="mt-4 leading-relaxed text-ink-2">{p.summary}</p>
              <ul className="mt-6 border-t border-line">
                {p.services.map((s) => (
                  <li key={s.title} className="border-b border-line py-3 text-[0.9375rem]">
                    {s.title}
                  </li>
                ))}
              </ul>
              <Link href={`/clients#${p.slug}`} className="link-u mt-6 inline-block text-[0.9375rem]">
                More about {p.name.split(" ")[1]}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section heading="Selected work" tone="stone">
        <WorkIndex items={caseStudies.slice(0, 4)} />
        <Link href="/work" className="cta mt-10">
          All work
        </Link>
      </Section>

      <Section heading="In numbers" tone="night">
        <Figures items={stats} dark />
      </Section>

      <Section heading="How an engagement works">
        <p className="display max-w-3xl text-display-m">
          A semester-long project, staffed in July for the fall and December for the spring.
        </p>
        <ol className="mt-12 grid gap-10 md:grid-cols-4 md:gap-8">
          {engagement.map((e, i) => (
            <li key={e.step} className="border-t border-ink pt-5">
              <span className="text-sm text-muted">Step {i + 1}</span>
              <h3 className="mt-2 text-lg font-medium">{e.title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{e.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section heading="Clients include" tone="stone">
        <ul className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-4">
          {clients.map((c) => (
            <li key={c} className="display text-[1.6rem] leading-tight text-ink-2">
              {c}
            </li>
          ))}
        </ul>
      </Section>

      <Section heading="What clients say">
        <Quote {...featured} large />
        <div className="mt-16 grid gap-12 border-t border-line pt-10 md:grid-cols-2">
          {more.slice(0, 2).map((t) => (
            <Quote key={t.org} {...t} />
          ))}
        </div>
      </Section>

      <section className="border-t border-line">
        <div className="wrap grid gap-10 py-20 md:grid-cols-12 md:items-center md:py-28">
          <div className="md:col-span-7">
            <Photo src="/images/friends-stairs.jpg" alt="Graphite members on the Kravis Center stairs" ratio="aspect-[4/3]" position="50% 35%" sizes="(min-width:768px) 58vw, 100vw" />
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <h2 className="display text-display-m">For students</h2>
            <p className="mt-5 leading-relaxed text-ink-2">
              We recruit from all five colleges every fall and spring. New members train in our curriculum and join a client
              team in their first semester.
            </p>
            <div className="mt-8 flex flex-col items-start gap-4">
              <Link href="/students" className="cta">
                Membership and recruiting
              </Link>
              <Link href="/life" className="link-u text-ink-2">
                Life at Graphite
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
