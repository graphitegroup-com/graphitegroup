import Link from "@/components/app-link";
import { Logo } from "./mark";
import { site } from "@/content/site";

const columns = [
  {
    title: "Clients",
    links: [
      { href: "/clients", label: "What we do" },
      { href: "/work", label: "Our work" },
      { href: "/contact", label: "Start a project" },
    ],
  },
  {
    title: "Students",
    links: [
      { href: "/students", label: "Membership" },
      { href: "/students#recruiting", label: "Recruiting calendar" },
      { href: "/life", label: "Life at Graphite" },
    ],
  },
  {
    title: "Graphite",
    links: [
      { href: "/about", label: "About" },
      { href: "/people", label: "People" },
      { href: "/login", label: "Member login" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-night text-white">
      <div className="wrap pt-20 pb-10">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="display max-w-md text-[2rem] leading-[1.15]">Have a question worth a semester of work?</p>
            <Link href="/contact" className="cta mt-6 text-white">
              Start a conversation
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-10 text-[0.9375rem] sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-white/45">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-white/85 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-6 border-t border-white/12 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Logo className="text-white" />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55">
            <a href={site.linkedin} className="hover:text-white">
              LinkedIn
            </a>
            <a href={site.instagram} className="hover:text-white">
              Instagram
            </a>
            <span>Claremont, California</span>
            <span>© {new Date().getFullYear()} Graphite Group</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
