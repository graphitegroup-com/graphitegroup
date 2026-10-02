"use client";

import Image from "next/image";
import Link from "@/components/app-link";
import { useState, type ReactNode } from "react";
import type { CaseStudy } from "@/content/site";

/** Page opening: a large serif title, an intro, and optionally a captioned photograph. */
export function PageIntro({
  title,
  intro,
  children,
}: {
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="wrap pt-16 pb-14 md:pt-24 md:pb-20">
      <h1 className="display max-w-5xl text-display-l">{title}</h1>
      {intro && <div className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-2 md:text-xl">{intro}</div>}
      {children}
    </section>
  );
}

/** Two-column editorial section: a short heading on the left, content on the right. */
export function Section({
  heading,
  children,
  tone = "paper",
  id,
  className = "",
}: {
  heading: string;
  children: ReactNode;
  tone?: "paper" | "stone" | "night";
  id?: string;
  className?: string;
}) {
  const bg = { paper: "bg-paper", stone: "bg-stone", night: "bg-night text-white" }[tone];
  return (
    <section id={id} className={`${bg} scroll-mt-20 ${className}`}>
      <div className="wrap grid gap-8 py-20 md:grid-cols-12 md:py-28">
        <h2 className={`text-[0.9375rem] md:col-span-3 ${tone === "night" ? "text-white/55" : "text-muted"}`}>{heading}</h2>
        <div className="min-w-0 md:col-span-9">{children}</div>
      </div>
    </section>
  );
}

export function Photo({
  src,
  alt,
  caption,
  ratio = "aspect-[3/2]",
  position = "50% 50%",
  priority = false,
  sizes = "100vw",
}: {
  src: string;
  alt: string;
  caption?: string;
  ratio?: string;
  position?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <figure>
      <div className={`relative overflow-hidden bg-stone ${ratio}`}>
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" style={{ objectPosition: position }} />
      </div>
      {caption && <figcaption className="mt-3 text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}

/**
 * Selected work as an index: one row per engagement. Rows expand in place to show
 * the summary and result; with `href`, rows link elsewhere instead.
 */
export function WorkIndex({ items, href }: { items: CaseStudy[]; href?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="border-t border-ink">
      {items.map((c) => {
        const isOpen = open === c.client;
        const row = (
          <>
            <span className="display text-[1.75rem] leading-tight md:col-span-5 md:text-[2.1rem]">{c.client}</span>
            <span className="text-ink-2 md:col-span-4">{c.title}</span>
            <span className="text-sm text-muted md:col-span-2">{c.practice}</span>
            <span aria-hidden className="hidden text-right text-xl text-muted transition-transform duration-300 group-hover:translate-x-1 md:col-span-1 md:block">
              {href ? "→" : isOpen ? "−" : "+"}
            </span>
          </>
        );
        const rowCls = "group grid w-full gap-1 py-6 text-left md:grid-cols-12 md:items-baseline md:gap-6";
        return (
          <li key={c.client} className="border-b border-line">
            {href ? (
              <Link href={href} className={rowCls}>
                {row}
              </Link>
            ) : (
              <button type="button" className={rowCls} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : c.client)}>
                {row}
              </button>
            )}
            {!href && isOpen && (
              <div className="grid gap-6 pb-10 md:grid-cols-12 md:gap-6">
                <p className="text-sm text-muted md:col-span-5">{c.sector}</p>
                <div className="max-w-2xl space-y-4 leading-relaxed md:col-span-7">
                  <p className="text-ink-2">{c.summary}</p>
                  <p>
                    <span className="text-muted">Result. </span>
                    {c.outcome}
                  </p>
                  {c.link && (
                    <a href={c.link.href} target="_blank" rel="noreferrer" className="link-u inline-block text-accent">
                      {c.link.label}
                    </a>
                  )}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Quote({ quote, name, org, large = false }: { quote: string; name: string; org: string; large?: boolean }) {
  return (
    <figure>
      <blockquote className={`display ${large ? "text-display-m" : "text-[1.4rem] leading-snug"}`}>“{quote}”</blockquote>
      <figcaption className="mt-6 text-[0.9375rem]">
        {name}
        <span className="text-muted">, {org}</span>
      </figcaption>
    </figure>
  );
}

/** Figures set in a row, separated by hairlines, no boxes. */
export function Figures({ items, dark = false }: { items: { value: string; label: string }[]; dark?: boolean }) {
  return (
    <dl className={`grid grid-cols-2 gap-y-10 border-t pt-8 md:grid-cols-4 ${dark ? "border-white/15" : "border-line"}`}>
      {items.map((s) => (
        <div key={s.label} className="pr-6">
          <dt className="sr-only">{s.label}</dt>
          <dd className="display text-[3.25rem] leading-none md:text-[4rem]">{s.value}</dd>
          <dd className={`mt-3 max-w-[15rem] text-sm leading-relaxed ${dark ? "text-white/60" : "text-muted"}`}>{s.label}</dd>
        </div>
      ))}
    </dl>
  );
}
