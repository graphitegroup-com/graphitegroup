import Link from "@/components/app-link";
import { MarkTile } from "./mark";
import { site } from "@/content/site";

const columns = [
  {
    title: "Our Work",
    links: [
      { href: "/work/strategy", label: "Graphite Strategy" },
      { href: "/work/digital", label: "Graphite Digital" },
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
      { href: "/login", label: "Member log in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="container-gg pt-16 pb-10 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.7fr_repeat(4,1fr)] lg:gap-8">
          <div>
            <div className="flex items-center gap-3">
              <MarkTile size={40} />
              <p className="text-[17px] font-light lg:whitespace-nowrap">{site.tagline}</p>
            </div>
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed font-light text-white/60">
              The student consulting group of the Claremont Colleges and the consulting arm of the Randall Lewis Center for Innovation &amp;
              Entrepreneurship.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:col-span-4 lg:gap-8">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-[15px] font-medium">{col.title}</p>
                <ul className="mt-4 space-y-2.5 text-[15px] font-light">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-white/85 hover:text-white hover:underline hover:underline-offset-4">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col-reverse justify-between gap-6 border-t border-white/25 pt-7 text-[14px] font-light text-white/70 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Graphite Group <span className="mx-1.5 text-white/35">/</span> Claremont, California
          </p>
          <div className="flex gap-5">
            <a href={site.instagram} aria-label="Instagram" className="text-white hover:text-pewter">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
              </svg>
            </a>
            <a href={site.linkedin} aria-label="LinkedIn" className="text-white hover:text-pewter">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
                <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1v5.46h-4v-4.84c0-1.16-.02-2.64-1.61-2.64-1.61 0-1.86 1.26-1.86 2.56v4.92h-4z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
