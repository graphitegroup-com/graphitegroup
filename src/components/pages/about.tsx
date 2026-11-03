"use client";

import { PageHeader, PersonRows, Photo, Pill, SideNav } from "../gg";
import { pillars } from "@/content/site";
import { useSiteContent } from "@/lib/use-site-content";

const SECTIONS = [
  { id: "who-we-are", label: "Who we are" },
  { id: "mission", label: "Our mission" },
  { id: "liberal-arts", label: "Liberal arts in action" },
  { id: "rlcie", label: "The RLCIE" },
  { id: "executive-board", label: "Executive board" },
];

export function AboutPageView() {
  const { groups, roster, stats } = useSiteContent();
  const exec = roster.filter((m) => m.group === groups[0]);
  const figures = [
    { value: stats[0]?.value ?? "77", label: "Engagements since 2018" },
    { value: stats[3]?.value ?? "90+", label: "Members and alumni" },
    { value: "5", label: "Colleges" },
  ];

  return (
    <>
      <PageHeader title="Liberal Arts in Action" />

      <div className="container-gg grid gap-10 pb-20 md:pb-28 lg:grid-cols-[13rem_minmax(0,40rem)] lg:gap-14 xl:grid-cols-[14rem_minmax(0,42rem)]">
        <div className="hidden lg:block">
          <SideNav items={SECTIONS} />
        </div>

        <article className="t-body min-w-0">
          <p className="t-lede">
            Established in 2018, Graphite Group is a Claremont-based college consulting club dedicated to lasting outcomes for its clients, members
            and the wider community. Here is who we are, what we stand for and where we sit at the Claremont Colleges.
          </p>

          <section id="who-we-are" className="scroll-mt-24 pt-10">
            <h2 className="t-h3">Who we are</h2>
            <div className="mt-4 space-y-5">
              <p>
                We give driven students the chance to engage deeply with business strategy, creating value for the startups we work with while
                building collaborative, career-defining experience.
              </p>
              <p>Over the years we have built a national network of clients, experts and alumni, and it keeps growing.</p>
            </div>
            <dl className="mt-8 grid grid-cols-3 border-y border-rule">
              {figures.map((f, i) => (
                <div key={f.label} className={`py-5 pr-3 ${i ? "border-l border-rule pl-4 sm:pl-6" : ""}`}>
                  <dt className="sr-only">{f.label}</dt>
                  <dd className="t-num !text-[clamp(2.2rem,4vw,3rem)]">{f.value}</dd>
                  <dd className="mt-2 text-[14px] leading-snug text-text">{f.label}</dd>
                </div>
              ))}
            </dl>
            <Photo src="/images/exec-laugh.jpg" alt="Members of the executive board" position="50% 40%" className="mt-10 aspect-[16/10]" sizes="(min-width:1024px) 42rem, 100vw" />
          </section>

          <section id="mission" className="scroll-mt-24 pt-14">
            <h2 className="t-h3">Our mission</h2>
            <p className="mt-4">Our work at Graphite is guided by three core pillars.</p>
            {pillars.map((p) => (
              <div key={p.title} className="mt-7">
                <h3 className="text-[18px] font-normal text-coal">{p.title}</h3>
                <p className="mt-2">{p.body}</p>
              </div>
            ))}
          </section>

          <section id="liberal-arts" className="scroll-mt-24 pt-14">
            <h2 className="t-h3">Liberal arts in action</h2>
            <div className="mt-4 space-y-5">
              <p>
                Graphite&apos;s mission and values are rooted in the liberal arts. Through classes across many disciplines, our members are prepared
                to address social, economic and cultural challenges from several perspectives at once.
              </p>
              <p>
                We offer clients that range of skills and worldviews, and give members the chance to put their education and experience to work on
                real problems.
              </p>
            </div>
            <Photo src="/images/kravis-building.jpg" alt="The Kravis Center at Claremont McKenna" position="50% 55%" className="mt-10 aspect-[16/10]" sizes="(min-width:1024px) 42rem, 100vw" />
          </section>

          <section id="rlcie" className="scroll-mt-24 pt-14">
            <h2 className="t-h3">The Randall Lewis Center for Innovation and Entrepreneurship</h2>
            <div className="mt-4 space-y-5">
              <p>
                The RLCIE is the premier entrepreneurship institute of the Claremont Colleges, named for businessman, visionary and philanthropist
                Randall Lewis. It supports an innovative, entrepreneurial community on campus through research, programming and resources for
                students and faculty.
              </p>
              <p>
                As the consulting arm of the institute, Graphite puts students on real business problems for real clients, developing the
                problem-solving and leadership skills the institute exists to build.
              </p>
            </div>
          </section>

          <section id="executive-board" className="scroll-mt-24 pt-14">
            <h2 className="t-h3">Executive board</h2>
            <div className="mt-7">
              <PersonRows people={exec} />
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Pill href="/people" variant="outline">
                Meet the full team
              </Pill>
              <Pill href="/contact">Work with us</Pill>
            </div>
          </section>
        </article>
      </div>
    </>
  );
}
