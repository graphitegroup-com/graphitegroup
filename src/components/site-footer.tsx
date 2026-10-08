import Link from "@/components/app-link";
import { Logo } from "./mark";
import { site } from "@/content/site";

const columns = [
  {
    title: "Our Work",
    links: [
      { href: "/work/strategy", label: "Strategy" },
      { href: "/work/digital", label: "Digital" },
      { href: "/work", label: "Case Studies" },
    ],
  },
  {
    title: "For Clients",
    links: [
      { href: "/clients", label: "How we work" },
      { href: "/contact", label: "Start a project" },
    ],
  },
  {
    title: "For Students",
    links: [
      { href: "/students", label: "Membership" },
      { href: "/students#recruiting", label: "Recruiting" },
      { href: "/life", label: "Life at Graphite" },
    ],
  },
  {
    title: "Graphite",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/people", label: "Our Team" },
      { href: "/login", label: "Log in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="container-gg pt-20 pb-10">
        <div className="grid gap-12 border-b border-white/12 pb-16 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-[15px] text-white/60">
              The student consulting group of the Claremont Colleges and the consulting arm of the Randall Lewis Center for
              Innovation & Entrepreneurship.
            </p>
            <div className="mt-6 flex gap-2.5">
              <a href={site.instagram} aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:bg-white hover:text-ink">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
                </svg>
              </a>
              <a href={site.linkedin} aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:bg-white hover:text-ink">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1v5.46h-4v-4.84c0-1.16-.02-2.64-1.61-2.64-1.61 0-1.86 1.26-1.86 2.56v4.92h-4z" />
                </svg>
              </a>
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[15px] font-semibold">{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-[15px] text-white/70">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-between gap-2 pt-7 text-sm text-white/50 sm:flex-row">
          <span>© {new Date().getFullYear()} Graphite Group. All rights reserved.</span>
          <span>Claremont, California</span>
        </div>
      </div>
    </footer>
  );
}
