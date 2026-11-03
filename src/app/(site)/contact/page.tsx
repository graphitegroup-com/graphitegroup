import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { FactCard, PageHeader } from "@/components/gg";
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
        title={
          <>
            Work <em>with us</em>
          </>
        }
        sub="Tell us about your organization and the question you are working on. A member of our leadership team will reply within a few business days."
      />

      <div className="container-gg grid items-start gap-6 pb-20 md:pb-28 lg:grid-cols-[1fr_20rem]">
        <div className="card p-6 md:p-10">
          <ContactForm />
        </div>

        <div className="space-y-6">
          <FactCard
            title="How engagements run"
            rows={[
              ["Fall projects staffed", "July"],
              ["Spring projects staffed", "December"],
              ["Typical length", "12 or 24 weeks"],
              ["Team", "Lead and 4 to 5 consultants"],
            ]}
          />
          <div className="card p-6 text-[15px] leading-relaxed">
            <p className="mb-2 text-[17px] font-normal text-coal">Students</p>
            <p>
              Contact {recruiting.contact.name}, {recruiting.contact.title}, at{" "}
              <a className="link-c [overflow-wrap:anywhere]" href={`mailto:${recruiting.contact.email}`}>
                {recruiting.contact.email}
              </a>
              . You can also find us on{" "}
              <a className="link-c" href={site.linkedin}>
                LinkedIn
              </a>{" "}
              and{" "}
              <a className="link-c" href={site.instagram}>
                Instagram
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
