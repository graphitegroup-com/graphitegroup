import type { Metadata } from "next";
import { PageHeader } from "@/components/blocks";
import { ContactForm } from "@/components/contact-form";
import { recruiting } from "@/content/recruiting";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a conversation with Graphite Group about a strategy or digital engagement.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        crumb="Contact"
        title="Contact us"
        intro="Tell us about your organization and the question you are working on. A member of our leadership team will follow up within a few business days."
      />
      <section className="bg-white py-16 md:py-24">
        <div className="wrap grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
          <aside className="space-y-10 lg:col-span-4 lg:col-start-9">
            <div className="border-t-[3px] border-accent bg-cloud p-7">
              <h2 className="font-serif text-2xl">Project timing</h2>
              <dl className="mt-5 space-y-4 text-[0.95rem]">
                <div className="flex justify-between gap-4 border-b border-line pb-4">
                  <dt className="text-slate">Fall engagements staffed</dt>
                  <dd className="font-medium">July</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-line pb-4">
                  <dt className="text-slate">Spring engagements staffed</dt>
                  <dd className="font-medium">December</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Typical length</dt>
                  <dd className="font-medium">12 or 24 weeks</dd>
                </div>
              </dl>
            </div>
            <div>
              <h2 className="font-serif text-2xl">Students</h2>
              <p className="mt-3 leading-relaxed text-slate">
                Interested in joining? Contact {recruiting.contact.name}, {recruiting.contact.title}, at{" "}
                <a className="text-accent underline-offset-4 hover:underline" href={`mailto:${recruiting.contact.email}`}>
                  {recruiting.contact.email}
                </a>
                .
              </p>
            </div>
            <div>
              <h2 className="font-serif text-2xl">Elsewhere</h2>
              <p className="mt-3 leading-relaxed text-slate">
                <a className="text-accent underline-offset-4 hover:underline" href={site.linkedin}>
                  LinkedIn
                </a>{" "}
                ·{" "}
                <a className="text-accent underline-offset-4 hover:underline" href={site.instagram}>
                  Instagram
                </a>
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
