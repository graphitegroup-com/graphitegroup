import Link from "@/components/app-link";
import { Logo } from "./mark";
import { site } from "@/content/site";

const columns = [
  {
    title: "What We Do",
    links: [
      { href: "/services#strategy", label: "Graphite Strategy" },
      { href: "/services#digital", label: "Graphite Digital" },
      { href: "/work", label: "Our Work" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "Who We Are" },
      { href: "/team", label: "Our People" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Join Us",
    links: [
      { href: "/students", label: "Membership" },
      { href: "/students#recruiting", label: "Recruiting Calendar" },
      { href: "/login", label: "Member Login" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-graphite text-white">
      <div className="wrap py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/65">
              The student consulting group of the Claremont Colleges and the consulting arm of the Randall Lewis Center
              for Innovation & Entrepreneurship.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold">{col.title}</p>
                <ul className="mt-4 space-y-3 text-sm text-white/65">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold">Follow</p>
            <ul className="mt-4 flex gap-3">
              <li>
                <a
                  href={site.linkedin}
                  aria-label="Graphite Group on LinkedIn"
                  className="flex h-9 w-9 items-center justify-center border border-white/25 transition-colors hover:bg-white hover:text-graphite"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1v5.46h-4v-4.84c0-1.16-.02-2.64-1.61-2.64-1.61 0-1.86 1.26-1.86 2.56v4.92h-4z" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href={site.instagram}
                  aria-label="Graphite Group on Instagram"
                  className="flex h-9 w-9 items-center justify-center border border-white/25 transition-colors hover:bg-white hover:text-graphite"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-white/15 pt-6 text-xs text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Graphite Group. All rights reserved.</p>
          <p>Claremont, California</p>
        </div>
      </div>
    </footer>
  );
}
