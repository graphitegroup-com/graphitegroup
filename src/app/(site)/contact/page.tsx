import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { PageIntro } from "@/components/editorial";
import { recruiting } from "@/content/recruiting";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a conversation with Graphite Group about a strategy or digital engagement.",
};

export default function ContactPage() {
  return (
    <>
      <PageIntro
        title="Start a project"
        intro="Tell us about your organization and the question you are working on. A member of our leadership team will reply within a few business days."
      />
      <section className="wrap grid gap-16 pb-28 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContactForm />
        </div>
        <aside className="space-y-10 text-[0.9375rem] lg:col-span-4 lg:col-start-9">
          <dl className="border-t border-ink">
            {[
              ["Fall engagements staffed", "July"],
              ["Spring engagements staffed", "December"],
              ["Typical length", "12 or 24 weeks"],
              ["Team", "Project lead and 4 to 5 consultants"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 border-b border-line py-3.5">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <div>
            <h2 className="font-medium">Students</h2>
            <p className="mt-2 leading-relaxed text-ink-2">
              Interested in joining? Write to {recruiting.contact.name}, {recruiting.contact.title}, at{" "}
              <a className="link-u" href={`mailto:${recruiting.contact.email}`}>
                {recruiting.contact.email}
              </a>
              .
            </p>
          </div>
          <div>
            <h2 className="font-medium">Elsewhere</h2>
            <p className="mt-2 space-x-5 text-ink-2">
              <a className="link-u" href={site.linkedin}>
                LinkedIn
              </a>
              <a className="link-u" href={site.instagram}>
                Instagram
              </a>
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
