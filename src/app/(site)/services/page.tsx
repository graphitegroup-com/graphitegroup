import type { Metadata } from "next";
import { ContactBand, PageHeader } from "@/components/blocks";
import { FadeIn } from "@/components/motion";
import { digitalArchive, engagement, practices } from "@/content/site";

export const metadata: Metadata = {
  title: "What We Do",
  description: "Graphite Strategy and Graphite Digital: market entry, positioning, pricing, product, software, data and AI.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        crumb="What We Do"
        title="Capabilities"
        intro="Graphite works in two practices. Strategy engagements answer market, pricing and growth questions. Digital engagements design, build and analyze. Many projects draw on both."
        image="/images/exec-stairs.jpg"
        imageAlt="Graphite Group consultants"
      />

      <nav className="sticky top-[72px] z-30 border-b border-line bg-white" aria-label="Practices">
        <div className="wrap flex gap-8 text-sm font-semibold">
          {practices.map((p) => (
            <a key={p.slug} href={`#${p.slug}`} className="py-4 text-slate hover:text-accent">
              {p.name}
            </a>
          ))}
          <a href="#approach" className="py-4 text-slate hover:text-accent">
            Our approach
          </a>
        </div>
      </nav>

      {practices.map((p, idx) => (
        <section key={p.slug} id={p.slug} className={`scroll-mt-32 py-20 md:py-28 ${idx % 2 ? "bg-cloud" : "bg-white"}`}>
          <div className="wrap grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="label label-rule">{p.kicker}</p>
              <h2 className="h-section">{p.name}</h2>
              <p className="lede mt-5">{p.long}</p>
              <p className="mt-8 text-xs font-semibold tracking-[0.12em] text-ink uppercase">
                {p.slug === "strategy" ? "Sectors served" : "Focus areas"}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate">{p.sectors.join(" · ")}</p>
            </div>
            <ul className="border-t border-line lg:col-span-7 lg:col-start-6">
              {p.services.map((s, i) => (
                <FadeIn as="li" key={s.title} delay={i * 0.04} className="grid gap-2 border-b border-line py-7 sm:grid-cols-12">
                  <h3 className="font-serif text-2xl sm:col-span-5">{s.title}</h3>
                  <p className="leading-relaxed text-slate sm:col-span-7">{s.body}</p>
                </FadeIn>
              ))}
            </ul>
          </div>

          {p.slug === "digital" && (
            <div className="wrap mt-20">
              <h3 className="text-xs font-semibold tracking-[0.12em] text-ink uppercase">Selected Graphite Digital projects</h3>
              <table className="mt-5 w-full border-t border-line text-left text-[0.95rem]">
                <thead className="sr-only">
                  <tr>
                    <th>Year</th>
                    <th>Client</th>
                    <th>Work</th>
                  </tr>
                </thead>
                <tbody>
                  {digitalArchive.map((d) => (
                    <tr key={d.client} className="border-b border-line align-top">
                      <td className="w-20 py-4 pr-4 text-slate">{d.year}</td>
                      <td className="py-4 pr-6 font-medium md:w-1/3">{d.client}</td>
                      <td className="hidden py-4 text-slate md:table-cell">{d.work}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      <section id="approach" className="scroll-mt-32 bg-white py-20 md:py-28">
        <div className="wrap">
          <p className="label label-rule">Our approach</p>
          <h2 className="h-section max-w-2xl">How an engagement works</h2>
          <p className="lede mt-5 max-w-2xl">
            Projects run one semester (about 12 weeks) or two (about 24). Each is staffed with four to five consultants
            and a project lead who manages communication and the work.
          </p>
          <ol className="mt-12 grid gap-px border border-line bg-line md:grid-cols-4">
            {engagement.map((e) => (
              <li key={e.step} className="bg-white p-7">
                <span className="font-serif text-4xl text-accent">{e.step}</span>
                <h3 className="mt-5 text-lg font-semibold">{e.title}</h3>
                <p className="mt-2 leading-relaxed text-slate">{e.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <ContactBand />
    </>
  );
}
