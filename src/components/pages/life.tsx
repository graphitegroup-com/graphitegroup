"use client";

import Image from "next/image";
import { Band, FocusItems, GradTitle, PhotoHero, Pill, Section, Testimonials } from "../gg";

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

export function LifeView() {
  return (
    <>
      <PhotoHero image="/images/friends-stairs.jpg" position="50% 35%" align="center" height="h-[460px] md:h-[560px]" title="Life at Graphite" />

      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <GradTitle className="t-h2">More than a consulting club</GradTitle>
          <p className="t-body mt-6">
            Graphite is where many members find their closest friends at Claremont. We work hard on real client projects, and
            we spend just as much time together outside of them: dinners, trips, service and a lot of late-night work
            sessions.
          </p>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-12 md:gap-5">
          {photos.map((p) => (
            <figure key={p.src} className={p.className.split(" ")[0]}>
              <div className={`relative overflow-hidden rounded-[6px] ${p.className.split(" ").slice(1).join(" ")}`}>
                <Image src={p.src} alt={p.alt} fill sizes="(min-width:768px) 60vw, 100vw" className="object-cover" style={{ objectPosition: p.position }} />
              </div>
              <figcaption className="mt-2 text-sm text-text">{p.caption}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Band>
        <h2 className="t-h2 text-center">Our Community</h2>
        <div className="mt-16">
          <FocusItems
            items={[
              { icon: "people", title: "Buddies", body: "Every first-year is paired with an upperclass member who helps with classes, recruiting and everything in between." },
              { icon: "spark", title: "Socials and service", body: "Dinners, trips and community service bring together members who might never otherwise share a class." },
              { icon: "book", title: "Recruiting together", body: "Interview notes, mock cases and alumni introductions are shared across the group. Nobody recruits alone." },
              { icon: "arrow", title: "Alumni", body: "Once a member of Graphite, always a member. Alumni stay involved through coffee chats, referrals and mentorship." },
            ]}
          />
        </div>
      </Band>

      <Section>
        <GradTitle className="t-h2">A Semester at Graphite</GradTitle>
        <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {semester.map((s) => (
            <li key={s.title} className="card-glow rounded-[6px] bg-white p-7">
              <span className="text-sm text-text">{s.when}</span>
              <h3 className="t-h4 mt-2">{s.title}</h3>
              <p className="t-body mt-3 text-[15px]">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section className="!pt-0">
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
        <div className="mt-14 flex justify-center gap-3">
          <Pill href="/students#recruiting">Recruiting dates</Pill>
          <Pill href="/people" variant="outline">
            Meet the team
          </Pill>
        </div>
      </Section>
    </>
  );
}
