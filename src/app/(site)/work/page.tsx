import type { Metadata } from "next";
import { ContactBand, PageHeader } from "@/components/blocks";
import { CaseIndex } from "@/components/case-index";
import { testimonials } from "@/content/site";

export const metadata: Metadata = {
  title: "Our Work",
  description: "Selected Graphite Group engagements for IBM, vals.ai, Paulaner and more.",
};

export default function WorkPage() {
  return (
    <>
      <PageHeader
        crumb="Our Work"
        title="Client work"
        intro="Since 2018 we have completed 77 engagements across nine sectors. A selection is below; many clients ask us to keep their work confidential."
      />
      <CaseIndex />
      <section className="bg-cloud py-20 md:py-28">
        <div className="wrap">
          <p className="label label-rule">Client perspectives</p>
          <h2 className="h-section">What our clients say</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.org} className="flex flex-col justify-between border-t-[3px] border-accent bg-white p-7">
                <blockquote className="font-serif text-lg leading-relaxed">“{t.quote}”</blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="block font-semibold">{t.name}</span>
                  <span className="text-slate">{t.org}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
      <ContactBand />
    </>
  );
}
