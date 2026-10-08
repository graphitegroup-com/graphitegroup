import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { GradTitle, Section } from "@/components/gg";
import { recruiting } from "@/content/recruiting";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a conversation with Graphite Group about a strategy or digital engagement.",
};

export default function ContactPage() {
  return (
    <Section>
      <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <GradTitle as="h1" className="t-h1">
            Work With Us
          </GradTitle>
          <p className="t-body mt-6 max-w-md">
            Tell us about your organization and the question you are working on. A member of our leadership team will reply
            within a few business days.
          </p>
          <dl className="mt-10 max-w-md divide-y divide-line border-y border-line text-[15px]">
            {[
              ["Fall projects staffed", "July"],
              ["Spring projects staffed", "December"],
              ["Typical length", "12 or 24 weeks"],
              ["Team", "Project lead and 4 to 5 consultants"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-3.5">
                <dt className="text-text">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="t-body mt-10 max-w-md text-[15px]">
            Students: contact {recruiting.contact.name}, {recruiting.contact.title}, at{" "}
            <a className="link-u text-ink" href={`mailto:${recruiting.contact.email}`}>
              {recruiting.contact.email}
            </a>
            . You can also find us on{" "}
            <a className="link-u text-ink" href={site.linkedin}>
              LinkedIn
            </a>{" "}
            and{" "}
            <a className="link-u text-ink" href={site.instagram}>
              Instagram
            </a>
            .
          </p>
        </div>
        <div className="card-glow rounded-[6px] bg-white p-8 md:p-10">
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}
