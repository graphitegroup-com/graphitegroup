"use client";

import Link from "@/components/app-link";
import { useEffect, useRef, useState } from "react";
import { usePagePath } from "@/lib/use-page-path";
import { MarkTile } from "./mark";
import { nav } from "@/content/site";

type NavItem = (typeof nav)[number];

const mobileLinks: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  ...nav.flatMap((n): { href: string; label: string }[] => ("children" in n ? [...n.children] : [{ href: n.href, label: n.label }])),
];

// Links split evenly around the mark, as on ycombinator.com.
const half = Math.ceil(nav.length / 2);
const leftNav = nav.slice(0, half);
const rightNav = nav.slice(half);

const linkCls = "whitespace-nowrap text-[15px] font-normal transition-colors";

export function SiteHeader() {
  const pathname = usePagePath();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on navigation (render-time reset, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
    setMenu(null);
  }

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const tone = (href: string) => (isActive(href) ? "text-prussian" : "text-coal hover:text-prussian");

  const item = (n: NavItem) =>
    "children" in n ? (
      <div key={n.label} ref={menuRef} className="relative" onMouseLeave={() => setMenu(null)}>
        <button
          type="button"
          aria-expanded={menu === n.label}
          onClick={() => setMenu((m) => (m === n.label ? null : n.label))}
          onMouseEnter={() => setMenu(n.label)}
          className={`flex items-center gap-1 ${linkCls} ${tone(n.href)}`}
        >
          {n.label}
          <svg viewBox="0 0 12 12" className={`h-2.5 w-2.5 transition-transform ${menu === n.label ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M2.5 4.5 6 8l3.5-3.5" />
          </svg>
        </button>
        {menu === n.label && (
          <div className="absolute top-full left-1/2 z-10 w-56 -translate-x-1/2 pt-3">
            <ul className="card p-1.5">
              {n.children.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="block rounded-[4px] px-3.5 py-2 text-[15px] font-normal text-coal hover:bg-gray">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ) : (
      <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined} className={`${linkCls} ${tone(n.href)}`}>
        {n.label}
      </Link>
    );

  return (
    <header className="sticky top-0 z-50 bg-page">
      <div className="relative flex h-16 items-center justify-center px-4 md:px-5">
        {/* Desktop: links split around the mark, sign-in and the pill at the right edge. */}
        <nav className="hidden items-center gap-9 min-[1240px]:flex 2xl:gap-12" aria-label="Primary">
          {leftNav.map(item)}
          <Link href="/" aria-label="Graphite Group home" className="mx-1">
            <MarkTile size={40} />
          </Link>
          {rightNav.map(item)}
        </nav>
        <div className="absolute top-1/2 right-5 hidden -translate-y-1/2 items-center gap-5 min-[1240px]:flex">
          <Link href="/login" className={`${linkCls} text-coal hover:text-prussian`}>
            Log in
          </Link>
          <Link href="/contact" className="pill">
            Work with us
          </Link>
        </div>

        {/* Below 1240px: the mark centered and a menu button at the right. */}
        <Link href="/" aria-label="Graphite Group home" className="min-[1240px]:hidden">
          <MarkTile size={40} />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="absolute top-1/2 right-3 flex h-11 w-11 -translate-y-1/2 items-center justify-center min-[1240px]:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 9h16M4 15h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-page min-[1240px]:hidden">
          <nav className="container-gg flex flex-col pt-4 pb-10" aria-label="Mobile">
            {mobileLinks.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={`border-b border-rule py-3.5 text-[20px] font-normal ${pathname === l.href ? "text-prussian" : "text-coal"}`}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link href="/contact" className="pill">
                Work with us
              </Link>
              <Link href="/login" className="text-[17px] font-normal text-coal">
                Log in
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
