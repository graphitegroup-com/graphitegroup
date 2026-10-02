"use client";

import Link from "@/components/app-link";
import { useEffect, useState } from "react";
import { usePagePath } from "@/lib/use-page-path";
import { Logo } from "./mark";
import { nav } from "@/content/site";

export function SiteHeader() {
  const pathname = usePagePath();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close the mobile menu on navigation (render-time reset, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={`sticky top-0 z-50 bg-paper transition-[border-color] ${scrolled || open ? "border-b border-line" : "border-b border-transparent"}`}>
      <div className="wrap flex h-[76px] items-center justify-between gap-8">
        <Link href="/" aria-label="Graphite Group home" className="text-ink">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`text-[0.9375rem] transition-colors hover:text-ink ${
                isActive(item.href) ? "text-ink underline decoration-1 underline-offset-[0.45em]" : "text-ink-2"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <span aria-hidden className="h-4 w-px bg-line" />
          <Link href="/login" className="text-[0.9375rem] font-medium text-ink hover:text-accent">
            Log in
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="-mr-2 flex h-10 items-center gap-2 px-2 text-[0.9375rem] text-ink lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-[77px] bottom-0 z-40 overflow-y-auto bg-paper lg:hidden">
          <nav className="wrap flex flex-col pt-6 pb-12" aria-label="Mobile">
            {[{ href: "/", label: "Home" }, ...nav, { href: "/contact", label: "Contact" }].map((item) => (
              <Link key={item.href} href={item.href} className="display border-b border-line py-4 text-[2rem] leading-tight text-ink">
                {item.label}
              </Link>
            ))}
            <Link href="/login" className="mt-8 text-lg font-medium text-ink">
              Log in →
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
