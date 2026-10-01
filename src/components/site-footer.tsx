import Link from "next/link";
import { Mark } from "./mark";
import { nav, site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="bg-grid-ink relative overflow-hidden bg-ink text-paper">
      <div className="container-page pt-24 pb-10">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="eyebrow text-graphite-400">The Claremont Colleges · Est. {site.founded}</p>
            <p className="mt-5 max-w-sm text-2xl leading-snug tracking-tight text-paper/90">
              Student consultants doing <span className="font-serif italic">professional</span> work, for clients who
              want fresh, rigorous thinking.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm md:col-span-7 md:grid-cols-3">
            <div>
              <p className="eyebrow mb-4 text-graphite-400">Explore</p>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/" className="text-paper/75 transition-colors hover:text-paper">
                    Home
                  </Link>
                </li>
                {nav.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="text-paper/75 transition-colors hover:text-paper">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-4 text-graphite-400">Practices</p>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/work#strategy" className="text-paper/75 transition-colors hover:text-paper">
                    Strategy
                  </Link>
                </li>
                <li>
                  <Link href="/work#digital" className="text-paper/75 transition-colors hover:text-paper">
                    Digital
                  </Link>
                </li>
                <li>
                  <Link href="/students#apply" className="text-paper/75 transition-colors hover:text-paper">
                    Apply
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-4 text-graphite-400">Elsewhere</p>
              <ul className="space-y-2.5">
                <li>
                  <a href={site.linkedin} className="text-paper/75 transition-colors hover:text-paper">
                    LinkedIn ↗
                  </a>
                </li>
                <li>
                  <a href={site.instagram} className="text-paper/75 transition-colors hover:text-paper">
                    Instagram ↗
                  </a>
                </li>
                <li>
                  <Link href="/members" className="text-paper/75 transition-colors hover:text-paper">
                    Member Portal
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-24 flex items-end gap-4 md:gap-8">
          <Mark className="h-[14vw] w-[14vw] max-h-48 max-w-48 shrink-0 text-paper" />
          <p
            aria-hidden
            className="text-sheen-light -mb-[0.06em] text-[18vw] leading-[0.8] font-semibold tracking-[-0.06em] md:text-[15.5vw] xl:text-[13.5rem]"
          >
            Graphite
          </p>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-paper/10 pt-6 text-xs text-graphite-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Graphite Group. Consulting arm of the Randall Lewis Center for Innovation &
            Entrepreneurship.
          </p>
          <p className="font-mono">{site.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
