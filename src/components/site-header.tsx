"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./mark";
import { nav, utilityNav } from "@/content/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close the mobile menu on navigation (render-time reset, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Utility bar */}
      <div className="hidden bg-graphite text-[0.8rem] text-white/75 md:block">
        <div className="wrap flex h-9 items-center justify-between">
          <span>Student consulting at the Claremont Colleges</span>
          <ul className="flex items-center gap-6">
            {utilityNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main bar */}
      <header
        className={`sticky top-0 z-50 border-b bg-white transition-shadow ${
          scrolled ? "border-line shadow-[0_1px_12px_rgba(20,24,29,0.06)]" : "border-line"
        }`}
      >
        <div className="wrap flex h-[72px] items-center justify-between gap-8">
          <Link href="/" aria-label="Graphite Group home" className="text-ink">
            <Logo />
          </Link>

          <nav className="hidden h-full items-stretch lg:flex" aria-label="Primary">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center px-4 text-[0.92rem] font-medium transition-colors hover:text-accent ${
                  isActive(item.href) ? "text-accent" : "text-ink"
                }`}
              >
                {item.label}
                {isActive(item.href) && <span className="absolute inset-x-4 bottom-0 h-[3px] bg-accent" />}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/contact" className="btn btn-primary hidden sm:inline-flex">
              Work with us
            </Link>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center text-ink lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <span className="relative block h-3.5 w-5">
                <span
                  className={`absolute left-0 h-[2px] w-5 bg-current transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`}
                />
                <span className={`absolute top-1.5 left-0 h-[2px] w-5 bg-current transition-opacity ${open ? "opacity-0" : ""}`} />
                <span
                  className={`absolute left-0 h-[2px] w-5 bg-current transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`}
                />
              </span>
            </button>
          </div>
        </div>

        {open && (
          <div className="fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto border-t border-line bg-white lg:hidden">
            <nav className="wrap py-4" aria-label="Mobile">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between border-b border-line py-4 text-lg ${
                    isActive(item.href) ? "text-accent" : "text-ink"
                  }`}
                >
                  {item.label}
                  <span aria-hidden className="text-mist">
                    ›
                  </span>
                </Link>
              ))}
              <div className="mt-6 flex flex-col gap-3 text-slate">
                {utilityNav.map((item) => (
                  <Link key={item.href} href={item.href} className="py-1">
                    {item.label}
                  </Link>
                ))}
              </div>
              <Link href="/contact" className="btn btn-primary mt-8 w-full justify-center">
                Work with us
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
