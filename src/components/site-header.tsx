"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { HoverMark } from "./mark";
import { nav } from "@/content/site";
import { EASE } from "./motion";

/** Pages whose hero is dark, so the header starts in light-on-dark mode. */
const DARK_HERO = ["/", "/work", "/students", "/members"];

export function SiteHeader() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    setHidden(y > 400 && y > prev && !open);
  });

  // Close the mobile menu on navigation (render-time reset, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const onDark = DARK_HERO.includes(pathname) && !scrolled;
  const tone = open
    ? "text-paper"
    : onDark
      ? "text-paper"
      : "text-ink";

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div
          className={`transition-[background-color,backdrop-filter,border-color] duration-500 ${
            scrolled && !open
              ? "border-b border-ink/5 bg-paper/75 backdrop-blur-xl"
              : "border-b border-transparent"
          }`}
        >
          <div className={`container-page flex h-16 items-center justify-between md:h-20 ${tone}`}>
            <Link href="/" className="flex items-center gap-2.5" aria-label="Graphite Group home">
              <HoverMark className="h-7 w-7" />
              <span className="text-[0.95rem] font-semibold leading-[1.05] tracking-tight">
                Graphite
                <br />
                Group
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
              {nav.map((item) => {
                const active = item.href !== "/#contact" && pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative rounded-full px-4 py-2 text-sm transition-colors ${
                      active ? "" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className={`absolute inset-0 -z-10 rounded-full ${onDark ? "bg-paper/10" : "bg-ink/[0.06]"}`}
                        transition={{ duration: 0.5, ease: EASE }}
                      />
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/members"
                className={`group hidden items-center gap-2 rounded-full py-2.5 pr-3 pl-4 text-sm font-medium transition-colors sm:inline-flex ${
                  onDark ? "bg-paper text-ink hover:bg-steel" : "bg-ink text-paper hover:bg-graphite-700"
                }`}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-steel-deep opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-steel-deep" />
                </span>
                Member Portal
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="relative flex h-10 w-10 items-center justify-center md:hidden"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
              >
                <span
                  className={`absolute h-px w-5 bg-current transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-1"}`}
                />
                <span
                  className={`absolute h-px w-5 bg-current transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-1"}`}
                />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="bg-grid-ink fixed inset-0 z-40 flex flex-col bg-ink pt-24 text-paper md:hidden"
          >
            <nav className="container-page flex flex-col" aria-label="Mobile">
              {[{ href: "/", label: "Home" }, ...nav, { href: "/members", label: "Member Portal" }].map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: EASE }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline justify-between border-b border-paper/10 py-4 text-4xl font-medium tracking-tight"
                  >
                    {item.label}
                    <span className="eyebrow text-graphite-400">0{i + 1}</span>
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
