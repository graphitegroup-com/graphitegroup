"use client";

import Image from "next/image";
import { PageHeader } from "../blocks";
import { FadeIn } from "../motion";
import { recruiting as recruitingDefaults } from "@/content/recruiting";
import { useSiteContent } from "@/lib/use-site-content";

const reasons = [
  {
    title: "Real client work",
    body: "Join a project team in your first semester and work directly with founders and executives on problems that matter to their business.",
  },
  {
    title: "Structured training",
    body: "The Graphite curriculum covers presentation craft, Excel, market sizing, pricing and more, followed by ongoing career resources.",
  },
  {
    title: "Early leadership",
    body: "After two semesters, apply to lead a project: manage the client relationship and a team of up to five consultants.",
  },
  {
    title: "A lasting community",
    body: "Buddy pairings, socials and service events across all five colleges, and an alumni network that stays involved.",
  },
];

const path = [
  {
    role: "Associate Consultant",
    when: "First semester",
    body: "Complete the Graphite curriculum, meet your buddy and join your first client team.",
  },
  {
    role: "Consultant",
    when: "Second semester on",
    body: "Own workstreams on engagements: interviews, analysis, models and the final recommendation.",
  },
  {
    role: "Team Lead",
    when: "After two semesters",
    body: "Lead a team of up to five and own the client relationship, supported by the Director of Client Relations.",
  },
  {
    role: "Executive Board",
    when: "Elected",
    body: "Run the organization: strategy, digital, recruiting and professional development, led by the Managing Director.",
  },
  {
    role: "Alumni",
    when: "After graduation",
    body: "Stay part of the network: coffee chats, referrals and mentorship for the classes that follow.",
  },
];

const destinations = ["Goldman Sachs", "J.P. Morgan", "BlackRock", "Jane Street", "Palantir", "McKinsey & Company", "Bain & Company"];

const voices = [
  {
    quote:
      "Taking on leadership was the most fulfilling experience of my time in undergrad. While the skills I gained have been invaluable, it's truly the Graphite community that has had the most profound impact on me.",
    name: "Matt San Luis",
    role: "Former Managing Director",
    photo: "/images/team/matt-san-luis.jpg",
  },
  {
    quote:
      "Graphite exposed me to a wide range of industries and business challenges, sharpening my problem-solving skills and giving me exposure that helped me define my career interests.",
    name: "Sumanje C.",
    role: "Former Team Lead",
  },
  {
    quote:
      "What I cherished most was the close-knit group. I met people who pushed me to be the best version of myself, and those connections will last the rest of my life.",
    name: "Sunny Wang",
    role: "Former Director of Recruiting",
    photo: "/images/team/sunny-wang.jpg",
  },
];

const faqs = [
  {
    q: "Who can apply?",
    a: "Any student at Pomona, Claremont McKenna, Harvey Mudd, Scripps or Pitzer. First-years and second-years are strongly encouraged to apply.",
  },
  {
    q: "What is the difference between Strategy and Digital?",
    a: "Strategy works on market entry, positioning, pricing and growth questions. Digital works on product design, software, data and AI. Digital recruiting includes a technical case.",
  },
  {
    q: "Do I need prior business experience?",
    a: "No. New members complete the Graphite curriculum before and alongside their first engagement.",
  },
  {
    q: "What does the recruiting process involve?",
    a: "Club fairs, information sessions and coffee chats, then a written application. Strategy candidates complete group and final interviews; Digital candidates complete a behavioral interview, a technical case and final interviews.",
  },
];

export function StudentsPageView() {
  const recruiting = { ...recruitingDefaults, ...useSiteContent().recruiting };
  const open = recruiting.status === "open";
  return (
    <>
      <PageHeader
        crumb="Join Us"
        title="Join Graphite Group"
        intro="Graphite is a student-run consulting group recruiting from all five Claremont Colleges at the start of every fall and spring semester. Members do real client work, learn a professional toolkit and build friendships that outlast college."
        image="/images/friends-stairs.jpg"
        imageAlt="Graphite members together on the Kravis Center stairs"
        imagePosition="50% 30%"
      />

      {/* Recruiting status strip */}
      <div className="border-b border-line bg-white">
        <div className="wrap flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center">
          <p className="text-[0.95rem]">
            <span className={`mr-3 inline-block h-2 w-2 ${open ? "bg-emerald-600" : "bg-accent"}`} />
            {open ? (
              <>
                <strong>{recruiting.cycle} applications are open.</strong> See the calendar below.
              </>
            ) : (
              <>
                <strong>{recruiting.cycle} recruiting has closed.</strong> {recruiting.next} recruiting opens at the start of
                next semester.
              </>
            )}
          </p>
          <a href="#recruiting" className="link-arrow">
            Recruiting details <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      <section className="bg-white py-20 md:py-28">
        <div className="wrap">
          <p className="label label-rule">Why Graphite</p>
          <h2 className="h-section max-w-2xl">More than a pre-professional club</h2>
          <div className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r, i) => (
              <FadeIn key={r.title} delay={i * 0.05} className="bg-white p-7">
                <h3 className="font-serif text-2xl">{r.title}</h3>
                <p className="mt-3 leading-relaxed text-slate">{r.body}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cloud py-20 md:py-28">
        <div className="wrap">
          <p className="label label-rule">Your path</p>
          <h2 className="h-section max-w-2xl">What membership looks like over time</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-5 md:gap-0">
            {path.map((p, i) => (
              <li key={p.role} className="relative md:pr-6">
                <div className="flex items-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-accent text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  {i < path.length - 1 && <span aria-hidden className="ml-3 hidden h-px flex-1 bg-line md:block" />}
                </div>
                <h3 className="mt-5 font-serif text-xl">{p.role}</h3>
                <p className="mt-1 text-xs font-semibold tracking-[0.12em] text-highlight uppercase">{p.when}</p>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-slate">{p.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="wrap grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative col-span-2 aspect-[16/9]">
              <Image src="/images/joshua-tree.jpg" alt="Graphite members at Joshua Tree" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover object-[50%_40%]" />
            </div>
            <div className="relative aspect-square">
              <Image src="/images/exec-stairs.jpg" alt="Graphite members at the Kravis Center" fill sizes="25vw" className="object-cover" />
            </div>
            <div className="relative aspect-square">
              <Image src="/images/campus.jpg" alt="The Claremont Colleges campus" fill sizes="25vw" className="object-cover" />
            </div>
          </div>
          <div>
            <p className="label label-rule">Life at Graphite</p>
            <h2 className="h-section">A community across five colleges</h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-slate">
              <p>
                Every first-year is paired with an upperclass buddy for mentorship through college and the recruiting
                process. Socials, trips and community service bring members together outside of client work.
              </p>
              <p>
                Members recruit together, too. Interview experiences and alumni introductions are shared across the group,
                so each class prepares with the knowledge of the classes before it.
              </p>
            </div>
            <p className="mt-10 text-xs font-semibold tracking-[0.12em] text-ink uppercase">Where members have recruited</p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-serif text-lg text-slate">
              {destinations.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="recruiting" className="scroll-mt-24 bg-cloud py-20 md:py-28">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="label label-rule">Recruiting</p>
            <h2 className="h-section">{open ? `${recruiting.cycle} recruiting` : "Recruiting calendar"}</h2>
            <p className="lede mt-5">
              {open
                ? "We recruit for two tracks. Applications are submitted online; interviews are held on campus."
                : recruiting.closedMessage}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {open ? (
                recruiting.applications.map((a, i) => (
                  <a
                    key={a.href}
                    href={a.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`btn ${i === 0 ? "btn-primary" : "btn-outline"}`}
                  >
                    {a.label} <span aria-hidden>→</span>
                  </a>
                ))
              ) : (
                <a href={recruiting.mailingList} target="_blank" rel="noreferrer" className="btn btn-primary">
                  Join the mailing list <span aria-hidden>→</span>
                </a>
              )}
            </div>
            <p className="mt-8 text-sm leading-relaxed text-slate">
              Questions? Contact {recruiting.contact.name}, {recruiting.contact.title}, at{" "}
              <a href={`mailto:${recruiting.contact.email}`} className="text-highlight hover:underline">
                {recruiting.contact.email}
              </a>
              .
            </p>
          </div>

          <div className="space-y-8 lg:col-span-7 lg:col-start-6">
            <p className="text-sm text-slate">
              {recruiting.cycle} schedule · Decisions released {recruiting.decisions}
            </p>
            {recruiting.calendar.map((phase) => (
              <div key={phase.phase}>
                <h3 className="font-serif text-xl">{phase.phase}</h3>
                <table className="mt-3 w-full border-t-2 border-ink bg-white text-left text-[0.95rem]">
                  <tbody>
                    {phase.items.map((it) => (
                      <tr key={it.what} className="border-b border-line align-top">
                        <td className="px-4 py-3">
                          {it.what}
                          {"where" in it && it.where && <span className="block text-sm text-slate sm:inline sm:pl-2">{it.where}</span>}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap text-slate">{it.when}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="wrap">
          <p className="label label-rule">From our alumni</p>
          <h2 className="h-section">In their words</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {voices.map((v) => (
              <figure key={v.name} className="flex flex-col justify-between border border-line p-7">
                <blockquote className="font-serif text-lg leading-relaxed">“{v.quote}”</blockquote>
                <figcaption className="mt-8 flex items-center gap-4 text-sm">
                  {v.photo ? (
                    <Image src={v.photo} alt="" width={48} height={48} className="h-12 w-12 object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center bg-cloud font-serif text-lg text-slate">
                      {v.name[0]}
                    </span>
                  )}
                  <span>
                    <span className="block font-semibold">{v.name}</span>
                    <span className="text-slate">{v.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white py-20 md:py-28">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="label label-rule">FAQ</p>
            <h2 className="h-section">Frequently asked questions</h2>
          </div>
          <div className="border-t border-line lg:col-span-7 lg:col-start-6">
            {faqs.map((f) => (
              <details key={f.q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden className="text-2xl leading-none text-highlight transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-6 leading-relaxed text-slate">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
