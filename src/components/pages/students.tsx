"use client";

import Link from "@/components/app-link";
import { PageIntro, Photo, Quote, Section } from "../editorial";
import { recruiting as recruitingDefaults } from "@/content/recruiting";
import { useSiteContent } from "@/lib/use-site-content";

const reasons = [
  {
    title: "Real client work",
    body: "Join a project team in your first semester and work directly with founders and executives on problems that matter to their business.",
  },
  {
    title: "A professional toolkit",
    body: "The Graphite curriculum covers presentations, Excel, market sizing and pricing, followed by ongoing career resources.",
  },
  {
    title: "Early leadership",
    body: "After two semesters, apply to lead a project: you manage the client relationship and a team of up to five.",
  },
  {
    title: "Friends across five colleges",
    body: "Buddy pairings, socials and service events, and an alumni network that stays involved after graduation.",
  },
];

const path = [
  { role: "Associate Consultant", when: "First semester", body: "Complete the curriculum, meet your buddy and join your first client team." },
  { role: "Consultant", when: "From the second semester", body: "Own workstreams: interviews, analysis, models and the final recommendation." },
  { role: "Team Lead", when: "After two semesters", body: "Lead a team of up to five and own the client relationship." },
  { role: "Executive Board", when: "Elected", body: "Run the organization: strategy, digital, recruiting and professional development." },
  { role: "Alumni", when: "After graduation", body: "Coffee chats, referrals and mentorship for the classes that follow." },
];

const destinations = ["Goldman Sachs", "J.P. Morgan", "BlackRock", "Jane Street", "Palantir", "McKinsey & Company", "Bain & Company"];

const voices = [
  {
    quote: "Taking on leadership was the most fulfilling experience of my time in undergrad. It's truly the Graphite community that has had the most profound impact on me.",
    name: "Matt San Luis",
    org: "former Managing Director",
  },
  {
    quote: "Graphite exposed me to a wide range of industries and business challenges, and helped me define my career interests.",
    name: "Sumanje C.",
    org: "former Team Lead",
  },
  {
    quote: "I met people who pushed me to be the best version of myself, and those connections will last the rest of my life.",
    name: "Sunny Wang",
    org: "former Director of Recruiting",
  },
];

const faqs = [
  { q: "Who can apply?", a: "Any student at Pomona, Claremont McKenna, Harvey Mudd, Scripps or Pitzer. First-years and second-years are strongly encouraged to apply." },
  { q: "Strategy or Digital?", a: "Strategy works on market entry, positioning, pricing and growth. Digital works on product design, software, data and AI, and its recruiting includes a technical case." },
  { q: "Do I need business experience?", a: "No. New members complete the Graphite curriculum before and alongside their first engagement." },
  { q: "What does recruiting involve?", a: "Club fairs, information sessions and coffee chats, then a written application. Strategy candidates have group and final interviews; Digital candidates have a behavioral interview, a technical case and finals." },
];

export function StudentsPageView() {
  const recruiting = { ...recruitingDefaults, ...useSiteContent().recruiting };
  const open = recruiting.status === "open";

  return (
    <>
      <PageIntro
        title="For students"
        intro="Graphite recruits from all five Claremont Colleges at the start of every fall and spring semester. Members do real client work, learn a professional toolkit and find friends for life."
      >
        <p className="mt-8 text-[0.9375rem] text-ink-2">
          {open ? (
            <>
              <strong className="font-medium text-ink">{recruiting.cycle} applications are open.</strong>{" "}
              <a href="#recruiting" className="link-u">
                Apply now
              </a>
            </>
          ) : (
            <>
              {recruiting.cycle} recruiting has closed. {recruiting.next} recruiting opens at the start of next semester.{" "}
              <a href="#recruiting" className="link-u">
                Get notified
              </a>
            </>
          )}
        </p>
      </PageIntro>

      <div className="wrap grid gap-4 md:grid-cols-12">
        <div className="md:col-span-8">
          <Photo src="/images/group-stairs.jpg" alt="Graphite Group on the Kravis Center stairs" ratio="aspect-[4/3]" position="50% 30%" priority sizes="(min-width:768px) 66vw, 100vw" />
        </div>
        <div className="hidden md:col-span-4 md:block">
          <Photo src="/images/joshua-tree.jpg" alt="Members at Joshua Tree" ratio="aspect-[3/4]" position="38% 50%" sizes="33vw" />
        </div>
      </div>

      <Section heading="Why Graphite">
        <div className="grid gap-x-12 gap-y-12 md:grid-cols-2">
          {reasons.map((r) => (
            <div key={r.title} className="border-t border-ink pt-5">
              <h3 className="display text-display-s">{r.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-2">{r.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section heading="How membership grows" tone="stone">
        <ol className="border-t border-ink">
          {path.map((p, i) => (
            <li key={p.role} className="grid gap-2 border-b border-line py-6 md:grid-cols-9 md:gap-6">
              <span className="text-muted md:col-span-1">{i + 1}</span>
              <span className="md:col-span-3">
                <span className="display block text-display-s">{p.role}</span>
                <span className="text-sm text-muted">{p.when}</span>
              </span>
              <span className="leading-relaxed text-ink-2 md:col-span-5">{p.body}</span>
            </li>
          ))}
        </ol>
        <Link href="/life" className="cta mt-10">
          See what life at Graphite looks like
        </Link>
      </Section>

      <Section heading="Where members recruit">
        <p className="display max-w-3xl text-display-m">
          Interview notes and alumni introductions are shared across the group, so each class prepares with what the last one
          learned.
        </p>
        <p className="mt-8 max-w-3xl text-lg leading-relaxed text-ink-2">Members have recruited with {destinations.slice(0, -1).join(", ")} and {destinations.at(-1)}.</p>
      </Section>

      <Section id="recruiting" heading={`Recruiting, ${recruiting.cycle}`} tone="stone">
        <div className="grid gap-14 lg:grid-cols-9">
          <div className="lg:col-span-4">
            <p className="display text-display-m">{open ? "Applications are open." : `See you in ${recruiting.next.split(" ")[0].toLowerCase()}.`}</p>
            <p className="mt-5 leading-relaxed text-ink-2">
              {open ? "Two tracks, Strategy and Digital. Applications are online; interviews are on campus." : recruiting.closedMessage}
            </p>
            <div className="mt-8 flex flex-col items-start gap-4">
              {open ? (
                recruiting.applications.map((a) => (
                  <a key={a.href} href={a.href} target="_blank" rel="noreferrer" className="cta">
                    {a.label}
                  </a>
                ))
              ) : (
                <a href={recruiting.mailingList} target="_blank" rel="noreferrer" className="cta">
                  Join the mailing list
                </a>
              )}
            </div>
            <p className="mt-10 text-sm leading-relaxed text-muted">
              Questions? {recruiting.contact.name}, {recruiting.contact.title},{" "}
              <a href={`mailto:${recruiting.contact.email}`} className="link-u text-ink-2">
                {recruiting.contact.email}
              </a>
            </p>
          </div>
          <div className="space-y-10 lg:col-span-5">
            {recruiting.calendar.map((phase) => (
              <div key={phase.phase}>
                <h3 className="font-medium">{phase.phase}</h3>
                <ul className="mt-3 border-t border-ink">
                  {phase.items.map((it) => (
                    <li key={it.what} className="flex flex-wrap justify-between gap-x-6 border-b border-line py-3 text-[0.9375rem]">
                      <span>
                        {it.what}
                        {"where" in it && it.where && <span className="text-muted">, {it.where}</span>}
                      </span>
                      <span className="text-muted tabular-nums">{it.when}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-sm text-muted">Decisions released {recruiting.decisions}.</p>
          </div>
        </div>
      </Section>

      <Section heading="From alumni">
        <div className="grid gap-12 md:grid-cols-3">
          {voices.map((v) => (
            <Quote key={v.name} {...v} />
          ))}
        </div>
      </Section>

      <Section heading="Questions" tone="stone">
        <div className="border-t border-ink">
          {faqs.map((f) => (
            <details key={f.q} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-5 text-lg [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden className="text-muted group-open:hidden">
                  +
                </span>
                <span aria-hidden className="hidden text-muted group-open:inline">
                  −
                </span>
              </summary>
              <p className="max-w-2xl pb-6 leading-relaxed text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}
