"use client";

import Image from "next/image";
import Link from "@/components/app-link";
import { CareersBand, PageHeader } from "../blocks";
import { StatsRow } from "../stats-row";
import { FadeIn } from "../motion";
import { colleges, pillars } from "@/content/site";
import { useSiteContent } from "@/lib/use-site-content";

export function AboutPageView() {
  const { groups, roster } = useSiteContent();
  const exec = roster.filter((m) => m.group === groups[0]);
  return (
    <>
      <PageHeader
        crumb="About"
        title="Who we are"
        intro="Established in 2018, Graphite Group is a Claremont-based consulting group dedicated to lasting outcomes for its clients, members and the wider community."
        image="/images/campus.jpg"
        imageAlt="The Claremont Colleges with the San Gabriel Mountains behind"
      />

      <section className="bg-white py-20 md:py-28">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="label label-rule">Our story</p>
            <h2 className="h-section">Liberal arts in action</h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-slate lg:col-span-7">
            <p>
              Graphite gives driven students the chance to engage deeply with business strategy, creating value for the
              organizations we work with while building collaborative and career-defining experience.
            </p>
            <p>
              Our members study across disciplines at {colleges.slice(0, -1).join(", ")} and {colleges.at(-1)}. That range
              is the point: clients get several perspectives on a single question, and members put their education to work
              on real problems.
            </p>
            <p>
              Over the years we have built a national network of clients, experts and alumni, and it keeps growing with
              every class.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cloud py-20 md:py-28">
        <div className="wrap">
          <p className="label label-rule">Our mission</p>
          <h2 className="h-section max-w-2xl">Guided by three pillars</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pillars.map((p, i) => (
              <FadeIn key={p.title} delay={i * 0.05} className="border-t-[3px] border-highlight bg-white p-8">
                <h3 className="font-serif text-2xl">{p.title}</h3>
                <p className="mt-3 leading-relaxed text-slate">{p.body}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="wrap grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[3/2] overflow-hidden">
            <Image
              src="/images/group-lawn.jpg"
              alt="Graphite Group at the Kravis Center"
              fill
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="label label-rule">Institutional partner</p>
            <h2 className="h-section">The Randall Lewis Center for Innovation & Entrepreneurship</h2>
            <p className="lede mt-5">
              The RLCIE is the premier entrepreneurship institute of the Claremont Colleges. As its consulting arm,
              Graphite puts students on real business problems for real clients, building the problem-solving and
              leadership skills the institute exists to develop.
            </p>
          </div>
        </div>
      </section>

      <StatsRow />

      <section className="bg-white py-20 md:py-28">
        <div className="wrap">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="label label-rule">Leadership</p>
              <h2 className="h-section">Executive board</h2>
            </div>
            <Link href="/team" className="link-arrow">
              Meet the full team <span aria-hidden>→</span>
            </Link>
          </div>
          <ul className="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {exec.map((m) => (
              <li key={m.id} className="bg-white p-6">
                <p className="font-serif text-xl">{m.name}</p>
                <p className="mt-1 text-sm text-slate">{m.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CareersBand />
    </>
  );
}
