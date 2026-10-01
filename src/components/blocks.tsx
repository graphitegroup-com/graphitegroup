import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "./motion";
import { site, type CaseStudy } from "@/content/site";

export function PageHeader({
  crumb,
  title,
  intro,
  image,
  imageAlt = "",
  imagePosition = "center",
}: {
  crumb: string;
  title: string;
  intro: string;
  image?: string;
  imageAlt?: string;
  imagePosition?: string;
}) {
  return (
    <section className="border-b border-line bg-cloud">
      <div className={`wrap grid gap-10 py-14 md:py-20 ${image ? "lg:grid-cols-2 lg:items-center" : ""}`}>
        <div className="max-w-2xl">
          <nav aria-label="Breadcrumb" className="text-sm text-slate">
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
            <span className="px-2 text-mist">/</span>
            <span className="text-ink">{crumb}</span>
          </nav>
          <h1 className="h-display mt-6">{title}</h1>
          <p className="lede mt-6">{intro}</p>
        </div>
        {image && (
          <div className="relative aspect-[3/2] overflow-hidden">
            <Image
              src={image}
              alt={imageAlt}
              fill
              priority
              sizes="(min-width:1024px) 50vw, 100vw"
              className="object-cover"
              style={{ objectPosition: imagePosition }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export function SectionIntro({
  label,
  title,
  body,
  action,
  dark = false,
}: {
  label: string;
  title: string;
  body?: string;
  action?: { href: string; label: string };
  dark?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div className="max-w-2xl">
        <p className={`label label-rule ${dark ? "!text-steel" : ""}`}>{label}</p>
        <h2 className="h-section">{title}</h2>
        {body && <p className={`mt-5 text-lg leading-relaxed ${dark ? "text-white/70" : "text-slate"}`}>{body}</p>}
      </div>
      {action && (
        <Link href={action.href} className={`link-arrow shrink-0 ${dark ? "!text-steel" : ""}`}>
          {action.label} <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}

export function CaseCard({ c, compact = false }: { c: CaseStudy; compact?: boolean }) {
  const digital = c.practice === "Digital";
  return (
    <article className="group flex h-full flex-col border border-line bg-white transition-shadow hover:shadow-[0_8px_30px_rgba(20,24,29,0.08)]">
      <div className={`relative flex h-40 flex-col justify-between p-6 text-white ${digital ? "bg-accent" : "bg-graphite"}`}>
        <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-80">
          {c.practice} · {c.sector}
        </span>
        <span className="font-serif text-3xl">{c.client}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="h-card">{c.title}</h3>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-slate">{c.summary}</p>
        {!compact && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-xs font-semibold tracking-[0.12em] text-ink uppercase">Result</p>
            <p className="mt-2 text-[0.95rem] leading-relaxed">{c.outcome}</p>
          </div>
        )}
        {c.link && !compact && (
          <a href={c.link.href} target="_blank" rel="noreferrer" className="link-arrow mt-5">
            {c.link.label} <span aria-hidden>↗</span>
          </a>
        )}
      </div>
    </article>
  );
}

export function StatsRow() {
  return (
    <section className="border-y border-line bg-white py-16 md:py-20">
      <div className="wrap">
        <h2 className="h-section text-center">Graphite Group by the numbers</h2>
        <dl className="mt-12 grid grid-cols-2 gap-y-10 md:grid-cols-4">
          {site.stats.map((s, i) => (
            <FadeIn
              key={s.label}
              delay={i * 0.05}
              className={`px-4 text-center md:px-8 ${i > 0 ? "md:border-l md:border-line" : ""}`}
            >
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-serif text-5xl text-accent md:text-6xl">{s.value}</dd>
              <dd className="mx-auto mt-3 max-w-[14rem] text-sm leading-relaxed text-slate">{s.label}</dd>
            </FadeIn>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function CareersBand() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="wrap grid lg:grid-cols-2">
        <div className="relative aspect-[4/3] lg:aspect-auto">
          <Image
            src="/images/exec-stairs.jpg"
            alt="Graphite Group members at the Kravis Center"
            fill
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="bg-accent p-8 text-white md:p-14">
          <p className="label label-rule !text-white">Join us</p>
          <h2 className="h-section">Build your career at Graphite</h2>
          <p className="mt-5 text-lg leading-relaxed text-white/85">
            We recruit at the start of every fall and spring semester from all five Claremont Colleges. New members
            train in our curriculum and join a client team in their first semester.
          </p>
          <ul className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
            {["Client work from day one", "Structured training", "Leadership after two semesters", "A lifelong alumni network"].map(
              (t) => (
                <li key={t} className="flex items-start gap-3">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-white" />
                  {t}
                </li>
              ),
            )}
          </ul>
          <Link href="/students" className="btn btn-light mt-10">
            Explore membership <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ContactBand() {
  return (
    <section className="bg-cloud py-16 md:py-20">
      <div className="wrap flex flex-col justify-between gap-8 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <h2 className="h-section">How can we help?</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate">
            Tell us about the decision in front of you. We scope every engagement with you before staffing a team.
          </p>
        </div>
        <Link href="/contact" className="btn btn-primary self-start md:self-auto">
          Contact us <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
