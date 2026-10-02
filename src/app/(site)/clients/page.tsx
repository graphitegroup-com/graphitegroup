import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro, Photo, Section } from "@/components/editorial";
import { engagement, practices } from "@/content/site";

export const metadata: Metadata = {
  title: "For Clients",
  description: "Graphite Strategy and Graphite Digital: market entry, positioning, pricing, product, software, data and AI.",
};

export default function ClientsPage() {
  return (
    <>
      <PageIntro
        title="For clients"
        intro="Graphite works in two practices. Strategy engagements answer market, pricing and growth questions. Digital engagements design, build and analyze. Many projects draw on both."
      >
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[0.9375rem]">
          {practices.map((p) => (
            <a key={p.slug} href={`#${p.slug}`} className="link-u text-ink-2">
              {p.name}
            </a>
          ))}
          <a href="#process" className="link-u text-ink-2">
            How we work
          </a>
        </div>
      </PageIntro>

      <div className="wrap">
        <Photo src="/images/exec-stairs.jpg" alt="Graphite consultants" ratio="aspect-[16/9] md:aspect-[21/9]" position="50% 35%" priority />
      </div>

      {practices.map((p, i) => (
        <Section key={p.slug} id={p.slug} heading={p.name} tone={i % 2 ? "stone" : "paper"}>
          <p className="display max-w-3xl text-display-m">{p.summary}</p>
          <p className="mt-6 max-w-2xl leading-relaxed text-ink-2">{p.long}</p>
          <dl className="mt-12 border-t border-ink">
            {p.services.map((s) => (
              <div key={s.title} className="grid gap-2 border-b border-line py-6 md:grid-cols-9 md:gap-6">
                <dt className="text-lg font-medium md:col-span-3">{s.title}</dt>
                <dd className="leading-relaxed text-ink-2 md:col-span-6">{s.body}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-sm text-muted">
            {p.slug === "strategy" ? "Sectors served: " : "Focus areas: "}
            {p.sectors.join(", ")}.
          </p>
        </Section>
      ))}

      <Section id="process" heading="How we work">
        <p className="display max-w-3xl text-display-m">
          One semester (about 12 weeks) or two (about 24), with a project lead and four to five consultants.
        </p>
        <ol className="mt-12 border-t border-ink">
          {engagement.map((e, i) => (
            <li key={e.step} className="grid gap-2 border-b border-line py-6 md:grid-cols-9 md:gap-6">
              <span className="text-muted md:col-span-1">{i + 1}</span>
              <span className="text-lg font-medium md:col-span-2">{e.title}</span>
              <span className="leading-relaxed text-ink-2 md:col-span-6">{e.body}</span>
            </li>
          ))}
        </ol>
        <div className="mt-14 flex flex-wrap items-baseline gap-x-8 gap-y-4">
          <Link href="/contact" className="cta text-lg">
            Start a project
          </Link>
          <Link href="/work" className="link-u text-ink-2">
            See past engagements
          </Link>
        </div>
      </Section>
    </>
  );
}
