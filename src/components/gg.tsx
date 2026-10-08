"use client";

/*
  Section building blocks rebuilt from the original graphitegroup.co.
  Every page is composed from these so the whole site keeps one system.
*/

import Image from "next/image";
import Link from "@/components/app-link";
import { useEffect, useState, type ReactNode } from "react";

/* ---------------------------------------------------------------- titles */

export function GradTitle({
  as: Tag = "h2",
  className = "t-h2",
  onBand = false,
  children,
}: {
  as?: "h1" | "h2" | "h3";
  className?: string;
  onBand?: boolean;
  children: ReactNode;
}) {
  return <Tag className={`${onBand ? "grad-title-band" : "grad-title"} ${className}`}>{children}</Tag>;
}

/* ---------------------------------------------------------------- heroes */

/** Full-bleed team photo, darkened, with the huge white title (home). */
export function PhotoHero({
  image,
  title,
  sub,
  position = "50% 42%",
  align = "left",
  height = "h-[560px] md:h-[640px]",
}: {
  image: string;
  title: ReactNode;
  sub?: ReactNode;
  position?: string;
  align?: "left" | "center";
  height?: string;
}) {
  return (
    <header className={`relative isolate overflow-hidden text-white ${height}`}>
      <Image src={image} alt="" fill priority sizes="100vw" className="-z-20 object-cover" style={{ objectPosition: position }} />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 to-black/75" />
      <div className={`container-gg flex h-full flex-col justify-center ${align === "center" ? "items-center text-center" : ""}`}>
        <h1 className={align === "center" ? "t-h1 max-w-4xl" : "t-hero"}>{title}</h1>
        {sub && <div className="mt-7 text-[clamp(1.5rem,3vw,2.5rem)] font-normal tracking-[-0.04em]">{sub}</div>}
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- layout */

export function Section({
  children,
  className = "",
  lines = true,
  id,
}: {
  children: ReactNode;
  className?: string;
  lines?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-24 py-20 md:py-[110px] ${lines ? "lines-bg" : ""} ${className}`}>
      <div className="container-gg">{children}</div>
    </section>
  );
}

export function Band({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`band scroll-mt-24 overflow-hidden py-24 md:py-[130px] ${className}`}>
      <div className="container-gg">{children}</div>
    </section>
  );
}

/** Text and a photo side by side, as in the original intro sections. */
export function TextImage({
  title,
  children,
  image,
  imageAlt = "",
  position = "50% 30%",
  reverse = false,
  actions,
  imageHeight = "h-[420px] md:h-[540px]",
}: {
  title: ReactNode;
  children: ReactNode;
  image: string;
  imageAlt?: string;
  position?: string;
  reverse?: boolean;
  actions?: ReactNode;
  imageHeight?: string;
}) {
  return (
    <div className={`grid items-center gap-12 lg:gap-[72px] ${reverse ? "lg:grid-cols-[1fr_1.25fr]" : "lg:grid-cols-[1.25fr_1fr]"}`}>
      <div className={reverse ? "lg:order-2" : ""}>
        <GradTitle className="t-h2 max-w-2xl">{title}</GradTitle>
        <div className="t-body mt-6 max-w-2xl space-y-4">{children}</div>
        {actions && <div className="mt-10 flex flex-wrap gap-3">{actions}</div>}
      </div>
      <div className={`relative overflow-hidden rounded-[6px] ${imageHeight} ${reverse ? "lg:order-1" : ""}`}>
        <Image src={image} alt={imageAlt} fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" style={{ objectPosition: position }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- stats with map */

export function StatsMap({ heading, stats }: { heading: ReactNode; stats: { value: string; label: string }[] }) {
  return (
    <div className="relative min-h-[520px]">
      {/* The original site's dotted world map, one version per band color. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/map-dark.webp" alt="" aria-hidden className="map-dark pointer-events-none absolute top-0 -right-10 w-[900px] max-w-none opacity-85" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/map-light.webp" alt="" aria-hidden className="map-light pointer-events-none absolute top-0 -right-10 w-[900px] max-w-none opacity-70" />
      <h2 className="t-h2 relative max-w-[620px]">{heading}</h2>
      <dl className="relative mt-16 flex flex-wrap justify-end gap-x-24 gap-y-10 md:mt-20">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="sr-only">{s.label}</dt>
            <dd className="text-[clamp(4.5rem,8vw,7rem)] leading-none font-medium tracking-[-0.06em]">{s.value}</dd>
            <dd className="mt-2 max-w-[13rem] text-[15px] text-band-muted">{s.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ---------------------------------------------------------------- focus items (icon tiles on band) */

const icons = {
  arrow: <path d="M5 5l14 14M19 8v11H8" />,
  lines: <path d="M4 7h16M8 12h12M12 17h8" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  people: <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0M16 4.5a3 3 0 0 1 0 6M21 20a5 5 0 0 0-3.5-4.8" />,
  spark: <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />,
  book: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20" />,
} as const;
export type IconName = keyof typeof icons;

export function FocusItems({ items }: { items: { icon: IconName; title: string; body: string }[] }) {
  return (
    <div className="mx-auto grid max-w-[1060px] gap-14 md:grid-cols-2 md:gap-20">
      {items.map((it) => (
        <div key={it.title} className="grid grid-cols-[56px_1fr] gap-6">
          <span className="icon-tile">
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {icons[it.icon]}
            </svg>
          </span>
          <div>
            <h3 className="t-h4">{it.title}</h3>
            <p className="mt-3 text-[17px] text-band-muted">{it.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- practice cards */

export function PracticeCards({
  items,
}: {
  items: { title: string; body: string; href: string; cta: string; image: string; position?: string; icon: "target" | "arrows" }[];
}) {
  return (
    <div className="grid gap-7 lg:grid-cols-2">
      {items.map((c) => (
        <article key={c.title} className="card-glow grid overflow-hidden rounded-[6px] bg-white sm:grid-cols-[1.15fr_1fr] sm:min-h-[470px]">
          <div className="flex flex-col p-8">
            <span className="flex h-[46px] w-[46px] items-center justify-center rounded-lg border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.icon === "target" ? "/brand/icon-target.svg" : "/brand/icon-arrows.svg"} alt="" width={26} height={26} />
            </span>
            <GradTitle as="h3" className="t-h3 mt-8">
              {c.title.split(" ")[0]}
              <br />
              {c.title.split(" ").slice(1).join(" ")}
            </GradTitle>
            <p className="t-body mt-5 mb-8 text-[15px]">{c.body}</p>
            <Link href={c.href} className="pill pill-sm mt-auto self-start">
              {c.cta}
            </Link>
          </div>
          <div className="relative min-h-[300px]">
            <Image src={c.image} alt="" fill sizes="(min-width:1024px) 25vw, 100vw" className="object-cover" style={{ objectPosition: c.position ?? "50% 30%" }} />
          </div>
        </article>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- case study cards on band */

export function CaseGrid({
  items,
}: {
  items: { client: string; title: string; practice: string; sector: string; summary: string; outcome: string; link?: { href: string; label: string } }[];
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {items.map((c) => (
        <article key={c.client} className="flex flex-col rounded-[6px] bg-white p-7 text-ink">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-[17px] font-semibold tracking-[-0.03em]">{c.title}</h3>
            <span className="text-right text-[15px] text-text italic">{c.client}</span>
          </div>
          <p className="t-body mt-4 text-[15px]">{c.summary}</p>
          <p className="mt-4 text-[15px]">
            <span className="font-semibold">Result: </span>
            {c.outcome}
          </p>
          {c.link && (
            <a href={c.link.href} target="_blank" rel="noreferrer" className="link-u mt-4 self-start text-[15px] text-sapphire">
              {c.link.label}
            </a>
          )}
          <p className="mt-auto pt-6 text-sm text-text italic">
            {c.practice} · {c.sector}
          </p>
        </article>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- testimonials */

export function Testimonials({ items, title = "What our clients say" }: { items: { quote: string; name: string; org: string }[]; title?: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setTimeout(() => setI((n) => (n + 1) % items.length), 6500);
    return () => clearTimeout(t);
  }, [i, paused, items.length]);
  const t = items[i] ?? items[0];
  if (!t) return null;
  return (
    <div className="text-center" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <GradTitle className="t-h2 inline-block">{title}</GradTitle>
      <figure key={i} className="mx-auto mt-12 min-h-[210px] max-w-[860px] animate-[ggfade_.5s_ease]" aria-live="polite">
        <blockquote className="text-[clamp(1.15rem,1.8vw,1.4rem)] leading-[1.55] text-[#3e4652]">“{t.quote}”</blockquote>
        <figcaption className="mt-8">
          <span className="block text-xl font-semibold">{t.name}</span>
          <span className="text-text">{t.org}</span>
        </figcaption>
      </figure>
      <div className="mt-8 flex justify-center gap-2">
        {items.map((q, n) => (
          <button
            key={q.name + n}
            type="button"
            onClick={() => setI(n)}
            aria-label={`Show testimonial ${n + 1}`}
            aria-current={n === i}
            className={`h-[3px] w-6 transition-colors ${n === i ? "bg-ink" : "bg-[#d4d9e1] hover:bg-[#aab2be]"}`}
          />
        ))}
      </div>
      <style>{`@keyframes ggfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

/* ---------------------------------------------------------------- team grid (original: black and white portraits) */

export function PeopleGrid({ people, five }: { people: { id: string; name: string; role: string; photo?: string }[]; five?: boolean }) {
  return (
    <ul className={`grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 ${five ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
      {people.map((p) => (
        <li key={p.id} className="group">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[6px] bg-gray">
            {p.photo ? (
              <Image
                src={p.photo}
                alt={p.name}
                fill
                sizes="(min-width:1024px) 22vw, 45vw"
                className="object-cover grayscale transition duration-500 group-hover:scale-[1.02] group-hover:grayscale-0"
              />
            ) : (
              <span aria-hidden className="absolute inset-0 flex items-center justify-center text-5xl font-semibold tracking-[-0.06em] text-pewter">
                {p.name
                  .split(/[\s-]+/)
                  .slice(0, 2)
                  .map((s) => s[0])
                  .join("")}
              </span>
            )}
          </div>
          <p className="mt-3 font-semibold tracking-[-0.03em]">{p.name}</p>
          <p className="text-sm text-text">{p.role}</p>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- accordion grid (original "Why join Graphite?") */

export function AccordionGrid({ items }: { items: { title: string; body: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="grid gap-x-16 md:grid-cols-2">
      {items.map((it, n) => (
        <div key={it.title} className="border-b border-band-line">
          <button
            type="button"
            onClick={() => setOpen(open === n ? null : n)}
            aria-expanded={open === n}
            className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-semibold tracking-[-0.03em]"
          >
            {it.title}
            <span aria-hidden className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/40 text-base transition-transform ${open === n ? "rotate-45" : ""}`}>
              +
            </span>
          </button>
          {open === n && <p className="pb-7 text-[17px] text-band-muted">{it.body}</p>}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- pillars over a photo (original "Our mission") */

export function PhotoPillars({
  image,
  title,
  sub,
  items,
}: {
  image: string;
  title: string;
  sub?: string;
  items: { title: string; body: string }[];
}) {
  return (
    <section className="relative isolate overflow-hidden py-24 text-white md:py-[130px]">
      <Image src={image} alt="" fill sizes="100vw" className="-z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#073863]/70 via-black/45 to-black/80" />
      <div className="container-gg">
        <h2 className="t-h2">{title}</h2>
        {sub && <p className="mt-3 text-white/80">{sub}</p>}
        <div className="mt-20 grid gap-12 md:grid-cols-3">
          {items.map((p) => (
            <div key={p.title}>
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="M5 5l14 14M19 8v11H8" />
              </svg>
              <h3 className="mt-4 text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.02] font-semibold tracking-[-0.05em]">{p.title}</h3>
              <p className="mt-5 max-w-xs text-[15px] text-white/85">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- small helpers */

export function Pill({ href, children, variant = "dark", small = false }: { href: string; children: ReactNode; variant?: "dark" | "outline" | "band" | "light"; small?: boolean }) {
  const cls = { dark: "", outline: "pill-outline", band: "pill-band", light: "pill-light" }[variant];
  const external = href.startsWith("http");
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={`pill ${cls} ${small ? "pill-sm" : ""}`}>
      {children}
    </a>
  ) : (
    <Link href={href} className={`pill ${cls} ${small ? "pill-sm" : ""}`}>
      {children}
    </Link>
  );
}

export function StatBoxes({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="grid max-w-xl grid-cols-3 gap-3">
      {items.map((s) => (
        <div key={s.label} className="rounded-[6px] bg-gray px-4 py-4 sm:px-5">
          <p className="text-[2.6rem] leading-none font-semibold tracking-[-0.05em] text-prussian">{s.value}</p>
          <p className="mt-2 text-sm text-text">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
