"use client";

/*
  Building blocks for the public site, modeled on ycombinator.com: centered
  serif page titles, light body copy, hairline cards, uppercase chips and
  black pills with italic serif labels. Every page is composed from these so
  the site keeps one system. Type and color classes live in app/globals.css.
*/

import Image from "next/image";
import Link from "@/components/app-link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

/* ---------------------------------------------------------------- motion preference */

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(motionQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
/** True when the visitor asked for less motion. Server render assumes reduced, so nothing auto-advances before hydration. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => true);
}

/* ---------------------------------------------------------------- layout */

export function Section({
  children,
  className = "",
  id,
  narrow = false,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  narrow?: boolean;
}) {
  return (
    <section id={id} className={`scroll-mt-24 py-16 md:py-24 ${className}`}>
      <div className={`container-gg ${narrow ? "container-narrow" : ""}`}>{children}</div>
    </section>
  );
}

/** Centered serif page title with an optional light subtitle, as on YC's directory and People pages. */
export function PageHeader({ title, sub, eyebrow, children }: { title: ReactNode; sub?: ReactNode; eyebrow?: ReactNode; children?: ReactNode }) {
  return (
    <header className="container-gg pt-14 pb-10 text-center md:pt-20 md:pb-14">
      {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
      <h1 className="t-display mx-auto max-w-4xl">{title}</h1>
      {sub && <div className="t-lede mx-auto mt-6 max-w-[40rem]">{sub}</div>}
      {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
    </header>
  );
}

/** Eyebrow label over a section heading. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

/** Centered closing prompt with a heading, a line of copy and actions. */
export function Closing({ title, body, children }: { title: ReactNode; body?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
      <h2 className="t-h2">{title}</h2>
      {body && <p className="t-body mt-5 text-text">{body}</p>}
      {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- small pieces */

export function Pill({
  href,
  children,
  variant = "dark",
  small = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "dark" | "outline" | "light";
  small?: boolean;
}) {
  const cls = `pill ${{ dark: "", outline: "pill-outline", light: "pill-light" }[variant]} ${small ? "pill-sm" : ""}`;
  if (!href.startsWith("/")) {
    const external = href.startsWith("http");
    return (
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="chip">{children}</span>;
}

export const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

/** Square tile with a client's initials, standing in for a logo. */
export function InitialsTile({ name, size = 64 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-[6px] border border-rule bg-white font-serif text-coal"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}

/** A rounded photo. Give it a size or aspect ratio through `className`. */
export function Photo({
  src,
  alt = "",
  className = "",
  position = "50% 40%",
  sizes = "(min-width:1024px) 50vw, 100vw",
  priority = false,
  shadow = true,
}: {
  src: string;
  alt?: string;
  className?: string;
  position?: string;
  sizes?: string;
  priority?: boolean;
  shadow?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[8px] bg-gray ${shadow ? "photo" : ""} ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" style={{ objectPosition: position }} />
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[14px] font-normal">
      <ol className="flex flex-wrap items-center gap-x-2">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-x-2">
            {i > 0 && (
              <span aria-hidden className="text-text">
                ›
              </span>
            )}
            {it.href ? (
              <Link href={it.href} className="link-c">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Key and value rows in a card, as in the sidebar of a YC company page. */
export function FactCard({ title, rows, image, children }: { title?: ReactNode; rows: [string, ReactNode][]; image?: { src: string; position?: string }; children?: ReactNode }) {
  return (
    <aside className="card p-6">
      {image && <Photo src={image.src} position={image.position} shadow={false} className="mb-6 aspect-[16/10]" sizes="(min-width:1024px) 300px, 100vw" />}
      {title && <p className="mb-4 text-[19px] font-normal text-coal">{title}</p>}
      <dl className="space-y-2.5 text-[16px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-6">
            <dt className="shrink-0">{k}:</dt>
            <dd className="text-right font-normal">{v}</dd>
          </div>
        ))}
      </dl>
      {children && <div className="mt-6 flex flex-wrap gap-2">{children}</div>}
    </aside>
  );
}

/* ---------------------------------------------------------------- figures */

/** Big serif numerals between hairlines. */
export function StatRow({ items }: { items: { value: string; label: string }[] }) {
  return (
    <dl className={`grid grid-cols-2 border-y border-rule ${items.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
      {items.map((s, i) => (
        <div key={s.label} className={`px-2 py-8 text-center md:px-6 ${i % 2 ? "border-l border-rule" : ""} ${i > 0 ? "md:border-l md:border-rule" : ""} ${i >= 2 ? "border-t border-rule md:border-t-0" : ""}`}>
          <dt className="sr-only">{s.label}</dt>
          <dd className="t-num">{s.value}</dd>
          <dd className="mx-auto mt-3 max-w-[14rem] text-[15px] leading-snug text-text">{s.label}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------------------------------------------------------------- work */

export type CaseItem = {
  client: string;
  title: string;
  practice: string;
  sector: string;
  summary: string;
  outcome: string;
  link?: { href: string; label: string };
};

/** Result rows, as in YC's Startup Directory: tile, name, one-liner, tags. */
export function CaseRows({ items }: { items: CaseItem[] }) {
  return (
    <ul className="card divide-y divide-rule overflow-hidden">
      {items.map((c) => (
        <li key={c.client} className="flex gap-4 p-5 sm:gap-6 sm:p-6">
          <span className="hidden sm:block">
            <InitialsTile name={c.client} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="text-[19px] font-medium text-coal">{c.client}</span>
              <span className="text-[15px] text-text">{c.title}</span>
            </p>
            <p className="mt-1.5 text-[16px] leading-relaxed">{c.summary}</p>
            <p className="mt-2 text-[16px] leading-relaxed">
              <span className="font-medium">Result: </span>
              {c.outcome}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Chip>{c.practice}</Chip>
              <Chip>{c.sector}</Chip>
              {c.link && (
                <a href={c.link.href} target="_blank" rel="noreferrer" className="link-c ml-1 text-[15px] font-normal">
                  {c.link.label}
                </a>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Client names in faded serif with one in focus, after YC's company list on
 * its home page. The brief sits on the left and the result on the right.
 */
export function ClientShowcase({ items }: { items: CaseItem[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const count = items.length;

  useEffect(() => {
    if (reduced || paused || count < 2) return;
    const t = setTimeout(() => setActive((n) => (n + 1) % count), 4800);
    return () => clearTimeout(t);
  }, [active, paused, reduced, count]);

  const c = items[Math.min(active, count - 1)];
  if (!c) return null;

  const brief = (
    <div className="card p-6">
      <p className="t-h4">{c.title}</p>
      <p className="mt-3 text-[16px] leading-relaxed">{c.summary}</p>
      <p className="mt-4 flex flex-wrap gap-2">
        <Chip>{c.practice}</Chip>
        <Chip>{c.sector}</Chip>
      </p>
    </div>
  );
  const result = (
    <div className="card p-6">
      <p className="text-[16px] leading-relaxed">{c.outcome}</p>
      {c.link && (
        <a href={c.link.href} target="_blank" rel="noreferrer" className="link-c mt-4 inline-block text-[15px] font-normal">
          {c.link.label}
        </a>
      )}
    </div>
  );

  return (
    <div
      className="grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,25rem)_1fr] lg:gap-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="hidden lg:block">
        <p className="mb-3 text-center font-serif text-[19px] text-coal italic">The brief</p>
        {brief}
      </div>
      <ul className="text-center">
        {items.map((it, i) => (
          <li key={it.client}>
            <button
              type="button"
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={`font-serif text-[clamp(1.75rem,2.9vw,2.4rem)] leading-[1.45] tracking-[-0.02em] transition-colors duration-500 lg:whitespace-nowrap ${
                i === active ? "text-coal" : "text-coal/50 hover:text-coal/75"
              }`}
            >
              {it.client}
            </button>
          </li>
        ))}
      </ul>
      <div className="hidden lg:block">
        <p className="mb-3 text-center font-serif text-[19px] text-coal italic">The result</p>
        {result}
      </div>
      <div className="space-y-4 lg:hidden">
        {brief}
        {result}
      </div>
    </div>
  );
}

/** Past projects: a table from the small breakpoint up, stacked rows on phones. */
export function ArchiveList({ rows }: { rows: readonly { year: number; client: string; work: string }[] }) {
  return (
    <div className="card overflow-hidden">
      <table className="hidden w-full text-left text-[16px] sm:table">
        <thead>
          <tr className="border-b border-rule">
            <th scope="col" className="eyebrow px-6 py-3 font-normal">
              Year
            </th>
            <th scope="col" className="eyebrow py-3 pr-6 font-normal">
              Client
            </th>
            <th scope="col" className="eyebrow py-3 pr-6 font-normal">
              Work
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.client} className="border-b border-rule align-top last:border-0">
              <td className="w-20 px-6 py-4 text-text tabular-nums">{d.year}</td>
              <td className="w-1/3 py-4 pr-6 font-normal text-coal">{d.client}</td>
              <td className="py-4 pr-6">{d.work}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="divide-y divide-rule sm:hidden">
        {rows.map((d) => (
          <li key={d.client} className="px-5 py-4 text-[16px] leading-relaxed">
            <p className="text-[14px] text-text tabular-nums">{d.year}</p>
            <p className="font-normal text-coal">{d.client}</p>
            <p className="mt-1">{d.work}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- practices */

export function PracticeCards({
  items,
}: {
  items: { title: string; body: string; href: string; cta: string; image: string; position?: string; tags?: string[] }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {items.map((c) => (
        <article key={c.title} className="card flex flex-col overflow-hidden">
          <div className="relative aspect-[16/9]">
            <Image src={c.image} alt="" fill sizes="(min-width:1024px) 34rem, 100vw" className="object-cover" style={{ objectPosition: c.position ?? "50% 30%" }} />
          </div>
          <div className="flex flex-1 flex-col p-6 md:p-8">
            <h3 className="t-h2 !text-[clamp(1.6rem,2.4vw,2rem)]">{c.title}</h3>
            {c.tags && (
              <p className="mt-4 flex flex-wrap gap-2">
                {c.tags.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </p>
            )}
            <p className="t-body mt-4 mb-7">{c.body}</p>
            <div className="mt-auto">
              <Pill href={c.href} variant="outline" small>
                {c.cta}
              </Pill>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- testimonials */

export function Testimonials({ items, title = "In our clients' words" }: { items: { quote: string; name: string; org: string }[]; title?: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || paused || items.length < 2) return;
    const t = setTimeout(() => setI((n) => (n + 1) % items.length), 7000);
    return () => clearTimeout(t);
  }, [i, paused, reduced, items.length]);
  const t = items[i] ?? items[0];
  if (!t) return null;
  return (
    <div className="text-center" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <h2 className="eyebrow">{title}</h2>
      <figure key={i} className="mx-auto mt-10 min-h-[220px] max-w-[52rem] motion-safe:animate-[ggfade_.5s_ease]">
        <blockquote className="font-serif text-[clamp(1.45rem,2.6vw,2.1rem)] leading-[1.4] font-normal tracking-[-0.01em] text-coal italic">“{t.quote}”</blockquote>
        <figcaption className="mt-8 text-[16px]">
          <span className="block font-medium text-coal">{t.name}</span>
          <span className="text-text">{t.org}</span>
        </figcaption>
      </figure>
      {items.length > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {items.map((q, n) => (
            <button
              key={q.name + n}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Show quote ${n + 1} of ${items.length}`}
              aria-current={n === i}
              className="flex h-6 w-7 items-center justify-center"
            >
              <span className={`h-[2px] w-6 transition-colors ${n === i ? "bg-coal" : "bg-rule hover:bg-text"}`} />
            </button>
          ))}
        </div>
      )}
      <style>{`@keyframes ggfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

/* ---------------------------------------------------------------- people */

/** Rows of square headshots with name and role, as on YC's People page. */
export function PersonRows({ people }: { people: { id: string; name: string; role: string; photo?: string }[] }) {
  return (
    <ul className="grid gap-x-12 gap-y-7 sm:grid-cols-2">
      {people.map((p) => (
        <li key={p.id} className="flex items-center gap-5">
          <span className="relative h-20 w-20 shrink-0 overflow-hidden border border-[#8d99a6] bg-gray">
            {p.photo ? (
              <Image src={p.photo} alt="" fill sizes="80px" className="object-cover" />
            ) : (
              <span aria-hidden className="absolute inset-0 flex items-center justify-center font-serif text-[26px] text-coal/60">
                {initials(p.name)}
              </span>
            )}
          </span>
          <span className="min-w-0 text-[17px] leading-snug font-medium text-coal">
            <span className="block">{p.name}</span>
            <span className="block">{p.role}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- lists */

/** Hairline list of expandable questions. */
export function Accordion({ items }: { items: { title: string; body: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="grid gap-x-14 md:grid-cols-2">
      {items.map((it, n) => (
        <div key={it.title} className="border-b border-rule">
          <h3>
            <button
              type="button"
              onClick={() => setOpen(open === n ? null : n)}
              aria-expanded={open === n}
              className="flex w-full items-center justify-between gap-6 py-5 text-left text-[18px] font-normal text-coal"
            >
              {it.title}
              <span aria-hidden className={`text-[22px] leading-none font-light transition-transform ${open === n ? "rotate-45" : ""}`}>
                +
              </span>
            </button>
          </h3>
          {open === n && <p className="pb-6 text-[16px] leading-relaxed text-text">{it.body}</p>}
        </div>
      ))}
    </div>
  );
}

/** Sticky in-page section links with the current section in Prussian, as on YC's About page. */
export function SideNav({ items }: { items: { id: string; label: string }[] }) {
  const [current, setCurrent] = useState(items[0]?.id);
  const ids = useRef(items.map((i) => i.id));
  useEffect(() => {
    const els = ids.current.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setCurrent(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return (
    <nav aria-label="On this page" className="sticky top-24">
      <ul className="space-y-2 text-[15px] font-normal">
        {items.map((it) => (
          <li key={it.id}>
            <a href={`#${it.id}`} aria-current={current === it.id ? "true" : undefined} className={current === it.id ? "text-prussian" : "text-coal hover:text-prussian"}>
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
