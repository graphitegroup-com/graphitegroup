"use client";

import Image from "next/image";
import { Closing, Eyebrow, PageHeader, Pill, Section, Testimonials } from "../gg";

const semester = [
  { when: "Weeks 1 to 4", title: "Recruiting", body: "Club fairs, info sessions and coffee chats across the five colleges. Current members run every event and interview." },
  { when: "Weeks 3 to 6", title: "Onboarding", body: "New members meet their buddy, start the Graphite curriculum and join their first client team." },
  { when: "Weeks 4 to 14", title: "Client work", body: "Weekly team meetings and client check-ins, with work sessions that often turn into dinner." },
  { when: "Final weeks", title: "Presentations and celebration", body: "Teams present to their clients, then the whole club gets together to close out the semester." },
];

const photos = [
  { src: "/images/joshua-tree.jpg", alt: "Members on a boulder at Joshua Tree", caption: "Joshua Tree", className: "md:col-span-8 aspect-[3/2]", position: "50% 40%" },
  { src: "/images/friends-stairs.jpg", alt: "Members laughing together on the stairs", caption: "Between meetings", className: "md:col-span-4 aspect-[3/4]", position: "50% 30%" },
  { src: "/images/exec-laugh.jpg", alt: "Members of the executive board", caption: "The executive board", className: "md:col-span-5 aspect-[5/4]", position: "50% 40%" },
  { src: "/images/campus.jpg", alt: "The Claremont Colleges with the San Gabriel Mountains", caption: "Claremont", className: "md:col-span-7 aspect-[7/4]", position: "50% 50%" },
];

const community = [
  { title: "Buddies", body: "Every first-year is paired with an upperclass member who helps with classes, recruiting and everything in between." },
  { title: "Socials and service", body: "Dinners, trips and community service bring together members who might never otherwise share a class." },
  { title: "Recruiting together", body: "Interview notes, mock cases and alumni introductions are shared across the group. Nobody recruits alone." },
  { title: "Alumni", body: "Once a member of Graphite, always a member. Alumni stay involved through coffee chats, referrals and mentorship." },
];

export function LifeView() {
  return (
    <>
      <PageHeader
        title={
          <>
            Life at <em>Graphite</em>
          </>
        }
        sub="Graphite is where many members find their closest friends at Claremont. We work hard on real client projects, and we spend just as much time together outside of them: dinners, trips, service and a lot of late-night work sessions."
      />

      <div className="container-gg pb-16 md:pb-24">
        <div className="grid gap-x-5 gap-y-8 md:grid-cols-12">
          {photos.map((p) => (
            <figure key={p.src} className={p.className.split(" ")[0]}>
              <div className={`photo relative overflow-hidden ${p.className.split(" ").slice(1).join(" ")}`}>
                <Image src={p.src} alt={p.alt} fill sizes="(min-width:768px) 60vw, 100vw" className="object-cover" style={{ objectPosition: p.position }} />
              </div>
              <figcaption className="mt-3 text-center font-serif text-[16px] text-coal italic">{p.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <Section className="!pt-0">
        <div className="mb-12 text-center">
          <Eyebrow>Our community</Eyebrow>
          <h2 className="t-h2 mt-4">More than a consulting club</h2>
        </div>
        <div className="mx-auto grid max-w-4xl gap-x-14 gap-y-10 md:grid-cols-2">
          {community.map((c) => (
            <div key={c.title}>
              <h3 className="t-h3">{c.title}</h3>
              <p className="t-body mt-3">{c.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="mb-12 text-center">
          <Eyebrow>The rhythm</Eyebrow>
          <h2 className="t-h2 mt-4">A semester at Graphite</h2>
        </div>
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {semester.map((s) => (
            <li key={s.title} className="card p-6">
              <p className="eyebrow text-text">{s.when}</p>
              <h3 className="t-h3 mt-3">{s.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <Testimonials
          title="In their words"
          items={[
            {
              quote: "What I cherished most was the close-knit group. I met amazing people who pushed me to be the best version of myself, and those connections will last for the rest of my life.",
              name: "Sunny Wang",
              org: "Former Director of Recruiting",
            },
            {
              quote: "Taking on leadership was the most fulfilling experience of my time in undergrad. It's truly the Graphite community that has had the most profound impact on me.",
              name: "Matt San Luis",
              org: "Former Managing Director",
            },
          ]}
        />
      </Section>

      <Section className="!pt-0">
        <Closing title={<>Come <em>meet us</em></>} body="We recruit at the start of every fall and spring semester.">
          <Pill href="/students#recruiting">Recruiting dates</Pill>
          <Pill href="/people" variant="outline">
            Meet the team
          </Pill>
        </Closing>
      </Section>
    </>
  );
}
