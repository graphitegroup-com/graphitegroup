"use client";

import Link from "@/components/app-link";
import { useEffect, useRef, useState } from "react";
import { usePagePath } from "@/lib/use-page-path";
import { Logo } from "./mark";
import { nav } from "@/content/site";

const mobileLinks: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  ...nav.flatMap((n): { href: string; label: string }[] => ("children" in n ? [...n.children] : [{ href: n.href, label: n.label }])),
];

export function SiteHeader() {
  const pathname = usePagePath();
  const [open, setOpen] = useState(false);
  const [workOpen, setWorkOpen] = useState(false);
  const workRef = useRef<HTMLDivElement>(null);

  // Close menus on navigation (render-time reset, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
    setWorkOpen(false);
  }

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  useEffect(() => {
    if (!workOpen) return;
    const onDown = (e: MouseEvent) => {
      if (workRef.current && !workRef.current.contains(e.target as Node)) setWorkOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [workOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-[#edf0f4] bg-white">
      <div className="container-gg flex h-[88px] items-center justify-between gap-6">
        <Link href="/" aria-label="Graphite Group home" className="text-ink">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 text-[15px] xl:flex" aria-label="Primary">
          {nav.map((item) =>
            "children" in item ? (
              <div key={item.label} ref={workRef} className="relative" onMouseLeave={() => setWorkOpen(false)}>
                <button
                  type="button"
                  aria-expanded={workOpen}
                  onClick={() => setWorkOpen((o) => !o)}
                  onMouseEnter={() => setWorkOpen(true)}
                  className={`flex items-center gap-1.5 ${isActive(item.href) ? "text-ink" : "text-ink/80 hover:text-ink"}`}
                >
                  {item.label}
                  <svg viewBox="0 0 12 12" className={`h-3 w-3 transition-transform ${workOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <path d="M2.5 4.5 6 8l3.5-3.5" />
                  </svg>
                </button>
                {workOpen && (
                  <div className="absolute top-full left-1/2 w-56 -translate-x-1/2 pt-4">
                    <ul className="rounded-2xl border border-[#edf0f4] bg-white p-2 shadow-[0_18px_50px_-12px_rgba(7,56,99,0.25)]">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="block rounded-xl px-4 py-2.5 hover:bg-gray">
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Link key={item.href} href={item.href} className={isActive(item.href) ? "text-ink" : "text-ink/80 hover:text-ink"}>
                {item.label}
              </Link>
            ),
          )}
          <Link href="/login" className="pill pill-sm">
            Log in
          </Link>
        </nav>

        <div className="flex items-center gap-3 xl:hidden">
          <Link href="/login" className="pill pill-sm hidden sm:inline-flex">
            Log in
          </Link>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#edf0f4]">
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              {open ? <path d="M5 5l10 10M15 5 5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-[89px] bottom-0 z-40 overflow-y-auto bg-white xl:hidden">
          <nav className="container-gg flex flex-col py-6" aria-label="Mobile">
            {mobileLinks.map((item) => (
              <Link key={item.href + item.label} href={item.href} className="border-b border-[#edf0f4] py-4 text-2xl font-semibold tracking-[-0.04em]">
                {item.label}
              </Link>
            ))}
            <Link href="/login" className="pill mt-8 self-start">
              Log in
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
