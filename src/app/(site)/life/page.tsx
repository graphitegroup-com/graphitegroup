import type { Metadata } from "next";
import Link from "@/components/app-link";
import { PageIntro, Photo, Quote, Section } from "@/components/editorial";

export const metadata: Metadata = {
  title: "Life at Graphite",
  description: "What Graphite Group is like socially: the people, the semester rhythm, buddies, socials and the alumni network.",
};

const semester = [
  {
    when: "Weeks 1 to 4",
    title: "Recruiting",
    body: "Club fairs, info sessions and coffee chats across the five colleges. Current members run every event and interview, so the club meets each candidate in person.",
  },
  {
    when: "Weeks 3 to 6",
    title: "Onboarding",
    body: "New members are paired with a buddy, start the Graphite curriculum and meet their client team.",
  },
  {
    when: "Weeks 4 to 14",
    title: "Client work",
    body: "Weekly team meetings and client check-ins, with work sessions that often turn into dinner.",
  },
  {
    when: "Final weeks",
    title: "Presentations and celebration",
    body: "Teams present their recommendations to clients, then the whole club gets together to close out the semester.",
  },
];

const community = [
  {
    title: "Buddies",
    body: "Every first-year is paired with an upperclass member who helps with classes, recruiting and everything in between.",
  },
  {
    title: "Socials and service",
    body: "Dinners, trips and community service events bring together members who might never otherwise share a class.",
  },
  {
    title: "Recruiting together",
    body: "Interview notes, mock cases and alumni introductions are shared across the group. Nobody recruits alone.",
  },
  {
    title: "Alumni",
    body: "Once a member, always a member. Alumni stay involved through coffee chats, referrals and mentorship.",
  },
];

export default function LifePage() {
  return (
    <>
      <PageIntro
        title="Life at Graphite"
        intro="Graphite is a consulting group, and it is also where many members find their closest friends at Claremont. Here is what that looks like."
      />

      <section className="wrap grid gap-4 md:grid-cols-12 md:gap-5">
        <div className="md:col-span-8">
          <Photo src="/images/joshua-tree.jpg" alt="Graphite members on a boulder at Joshua Tree" caption="Joshua Tree." ratio="aspect-[3/2]" position="50% 40%" priority sizes="(min-width:768px) 66vw, 100vw" />
        </div>
        <div className="md:col-span-4">
          <Photo src="/images/friends-stairs.jpg" alt="Members laughing together on the stairs" caption="Between meetings at the Kravis Center." ratio="aspect-[3/4]" position="50% 30%" sizes="(min-width:768px) 33vw, 100vw" />
        </div>
        <div className="md:col-span-5">
          <Photo src="/images/exec-laugh.jpg" alt="Members of the executive board laughing" caption="The executive board." ratio="aspect-[5/4]" position="50% 40%" sizes="(min-width:768px) 42vw, 100vw" />
        </div>
        <div className="md:col-span-7">
          <Photo src="/images/campus.jpg" alt="The Claremont Colleges with the San Gabriel Mountains" caption="Five colleges, one club. Claremont, with the San Gabriel Mountains behind." ratio="aspect-[7/4]" sizes="(min-width:768px) 58vw, 100vw" />
        </div>
      </section>

      <Section heading="A semester at Graphite">
        <ol className="grid gap-10 md:grid-cols-2 md:gap-x-12">
          {semester.map((s) => (
            <li key={s.title} className="border-t border-ink pt-5">
              <span className="text-sm text-muted">{s.when}</span>
              <h3 className="display mt-1 text-display-s">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-2">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section heading="Community" tone="stone">
        <dl className="border-t border-ink">
          {community.map((c) => (
            <div key={c.title} className="grid gap-2 border-b border-line py-6 md:grid-cols-9 md:gap-6">
              <dt className="display text-display-s md:col-span-3">{c.title}</dt>
              <dd className="leading-relaxed text-ink-2 md:col-span-6">{c.body}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section heading="In their words">
        <Quote
          large
          quote="What I cherished most was the close-knit group. I met people who pushed me to be the best version of myself, and those connections will last the rest of my life."
          name="Sunny Wang"
          org="former Director of Recruiting"
        />
      </Section>

      <section className="border-t border-line">
        <div className="wrap grid gap-10 py-20 md:grid-cols-12 md:items-end">
          <p className="display text-display-m md:col-span-7">Want to be in the next photo?</p>
          <div className="flex flex-col items-start gap-4 md:col-span-4 md:col-start-9">
            <Link href="/students#recruiting" className="cta text-lg">
              Recruiting dates
            </Link>
            <Link href="/students" className="link-u text-ink-2">
              How membership works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
