import Image from "next/image";
import Link from "next/link";
import { CareersBand, CaseCard, ContactBand, SectionIntro, StatsRow } from "@/components/blocks";
import { FadeIn } from "@/components/motion";
import { caseStudies, clients, practices, testimonials } from "@/content/site";

const practiceImages: Record<string, { src: string; alt: string; position: string }> = {
  strategy: { src: "/images/group-stairs.jpg", alt: "Graphite consultants on the Kravis Center stairs", position: "50% 35%" },
  digital: { src: "/images/friends-stairs.jpg", alt: "Graphite Digital team members", position: "50% 30%" },
};

const sectors = [
  "Technology & SaaS",
  "AI & Machine Learning",
  "Healthcare",
  "Financial Services",
  "Consumer & Retail",
  "Food & Beverage",
  "Real Estate",
  "Education",
  "Nonprofits & Institutions",
];

export default function Home() {
  const [featured, ...others] = testimonials;
  return (
    <>
      {/* Hero */}
      <section className="relative isolate bg-graphite text-white">
        <Image
          src="/images/group-lawn.jpg"
          alt="Members of Graphite Group at the Claremont Colleges"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[50%_40%]"
        />
        <div className="absolute inset-0 -z-10 bg-graphite/85 md:bg-transparent md:bg-gradient-to-r md:from-graphite/95 md:via-graphite/75 md:to-graphite/20" />
        <div className="wrap pt-20 pb-40 md:pt-28 md:pb-52">
          <div className="max-w-2xl">
            <p className="label label-rule !text-steel">Graphite Group · Est. 2018</p>
            <h1 className="h-display">Strategy and digital consulting from the Claremont Colleges</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              We partner with startups, institutions and Fortune 500 teams on market entry, pricing, product and data
              problems. Every engagement is staffed by students from all five colleges and led by an experienced project
              lead.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/contact" className="btn btn-primary">
                Work with us <span aria-hidden>→</span>
              </Link>
              <Link href="/work" className="btn btn-outline text-white hover:!border-white hover:!bg-white hover:!text-ink">
                Explore our work
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured work, overlapping the hero */}
      <section className="relative z-10 -mt-24 md:-mt-32">
        <div className="wrap">
          <div className="flex items-end justify-between pb-4 text-white">
            <p className="text-sm font-semibold">Featured client work</p>
            <Link href="/work" className="text-sm font-semibold text-white/80 hover:text-white">
              View all →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {caseStudies.slice(0, 3).map((c, i) => (
              <FadeIn key={c.client} delay={i * 0.06}>
                <CaseCard c={c} compact />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="bg-white py-20 md:py-28">
        <div className="wrap">
          <SectionIntro
            label="What we do"
            title="Two practices, one standard of work"
            body="Graphite Strategy answers the questions that shape a business. Graphite Digital builds the tools and analysis that put those answers to work."
            action={{ href: "/services", label: "All capabilities" }}
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {practices.map((p) => {
              const img = practiceImages[p.slug];
              return (
                <FadeIn key={p.slug}>
                  <Link href={`/services#${p.slug}`} className="group block border border-line">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(min-width:768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        style={{ objectPosition: img.position }}
                      />
                    </div>
                    <div className="p-7 md:p-8">
                      <p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">{p.kicker}</p>
                      <h3 className="mt-3 font-serif text-3xl">{p.name}</h3>
                      <p className="mt-3 leading-relaxed text-slate">{p.summary}</p>
                      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink">
                        {p.services.map((s) => (
                          <li key={s.title} className="flex items-center gap-2">
                            <span aria-hidden className="h-1 w-1 bg-accent" />
                            {s.title}
                          </li>
                        ))}
                      </ul>
                      <span className="link-arrow mt-7">
                        Learn more <span aria-hidden>→</span>
                      </span>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <StatsRow />

      {/* Sectors and clients */}
      <section className="bg-white py-20 md:py-28">
        <div className="wrap grid gap-14 lg:grid-cols-2">
          <div>
            <p className="label label-rule">Industries</p>
            <h2 className="h-section">Experience across nine sectors</h2>
            <p className="lede mt-5 max-w-lg">
              Our clients range from pre-revenue healthcare startups to a Fortune 500 technology company. The breadth is
              deliberate: members see many business models, and clients get a team that has seen many problems.
            </p>
            <ul className="mt-10 grid border-t border-line sm:grid-cols-2">
              {sectors.map((s) => (
                <li key={s} className="border-b border-line py-3.5 text-[0.95rem] sm:odd:pr-6">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label label-rule">Selected clients</p>
            <h2 className="h-section">Organizations we have worked with</h2>
            <ul className="mt-10 grid grid-cols-2 border-t border-l border-line">
              {clients.map((c) => (
                <li
                  key={c}
                  className="flex h-24 items-center justify-center border-r border-b border-line px-4 text-center font-serif text-xl text-slate"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-graphite py-20 text-white md:py-28">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <figure className="lg:col-span-7">
            <p className="label label-rule !text-steel">Client perspectives</p>
            <blockquote className="font-serif text-[clamp(1.6rem,2.8vw,2.3rem)] leading-snug">
              “{featured.quote}”
            </blockquote>
            <figcaption className="mt-8 text-sm">
              <span className="font-semibold">{featured.name}</span>
              <span className="text-white/60">, {featured.org}</span>
            </figcaption>
          </figure>
          <div className="space-y-8 lg:col-span-4 lg:col-start-9 lg:pt-14">
            {others.slice(0, 3).map((t) => (
              <figure key={t.org} className="border-t border-white/15 pt-6">
                <blockquote className="leading-relaxed text-white/80">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-white/60">, {t.org}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <CareersBand />
      <ContactBand />
    </>
  );
}
