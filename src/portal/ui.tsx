"use client";

import Link from "@/components/app-link";
import { useEffect, type ReactNode } from "react";
import { letterLabel } from "./logic";

/*
  Portal UI kit, modeled on Bookface: a warm beige page, white panels with
  hairline borders and 3px corners, small uppercase panel labels, Avenir at
  14px and one blue for actions and links. No shadows or gradients. Every
  portal page should be assembled from these.
*/

export function PageTitle({
  title,
  sub,
  actions,
  back,
}: {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-6">
      {back && (
        <nav aria-label="Breadcrumb" className="mb-2 text-[13px]">
          <Link href={back.href} className="text-link hover:underline">
            {back.label}
          </Link>
          <span className="mx-1.5 text-faint" aria-hidden>
            ›
          </span>
        </nav>
      )}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h1 className="text-[26px] leading-tight font-light text-ink">{title}</h1>
          {sub && <div className="mt-1.5 max-w-2xl text-[13.5px] text-muted">{sub}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Small uppercase label, the Bookface way of naming a panel or group. */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-[11.5px] font-medium tracking-[0.06em] text-muted uppercase ${className}`}>{children}</p>;
}

/** A bordered panel. `flush` drops the inner padding for full-width tables. */
export function Card({
  children,
  className = "",
  title,
  action,
  flush = false,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
  flush?: boolean;
}) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-[3px] border border-edge bg-white ${className}`}>
      {title && (
        <header className="flex min-h-10 items-center justify-between gap-4 border-b border-edge bg-[#fbfbf7] px-4 py-1.5">
          <h2 className="text-[11.5px] font-medium tracking-[0.06em] text-muted uppercase">{title}</h2>
          {action && <div className="text-[13px] text-muted">{action}</div>}
        </header>
      )}
      <div className={flush ? "" : "px-4 py-1"}>{children}</div>
    </section>
  );
}

const tones = {
  gray: "bg-[#efefe7] text-[#4f4f48]",
  blue: "bg-[#e6f0f9] text-[#1a5f96]",
  green: "bg-[#e5f3e9] text-[#1d6b37]",
  amber: "bg-[#fbf1da] text-[#7f5300]",
  red: "bg-[#fbe9e8] text-[#a8261b]",
  dark: "bg-ink text-white",
} as const;

export type Tone = keyof typeof tones;

/** Status label. */
export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex h-5 items-center rounded-[2px] px-1.5 text-[12px] leading-none font-medium whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}

const buttonVariants = {
  primary: "h-8 px-3 bg-accent text-white hover:bg-accent-hover",
  secondary: "h-8 px-3 border border-[#cfcfc4] bg-white text-ink hover:bg-stone",
  ghost: "h-7 px-2 text-muted hover:bg-stone hover:text-ink",
  danger: "h-7 px-2 text-[#a8261b] hover:bg-[#fbe9e8]",
} as const;

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[3px] text-[13px] font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${buttonVariants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** A link styled as a button. */
export function ButtonLink({
  href,
  children,
  variant = "secondary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonVariants;
  className?: string;
}) {
  const cls = `inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[3px] text-[13px] font-medium whitespace-nowrap transition-colors ${buttonVariants[variant]} ${className}`;
  return /^https?:/.test(href) ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** Inline text link in the portal's link blue. */
export const linkCls = "text-link hover:underline";

export const fieldCls =
  "w-full rounded-[3px] border border-[#d6d6cb] bg-white px-2.5 text-[13.5px] text-ink placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 focus:outline-none disabled:bg-stone disabled:text-muted";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldCls} h-8 read-only:bg-stone read-only:text-muted ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${fieldCls} resize-y py-1.5 leading-relaxed read-only:bg-stone read-only:text-muted ${props.className ?? ""}`} />;
}

type Option = string | { value: string; label: string };

export function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: readonly Option[] }) {
  return (
    <select {...props} className={`${fieldCls} h-8 pr-7 ${props.className ?? ""}`}>
      {options.map((o) => {
        const { value, label } = typeof o === "string" ? { value: o, label: o } : o;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

export function Check({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex items-start gap-2 text-[13px] text-ink-2">
      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {hint && <span className="block text-[12px] text-muted">{hint}</span>}
      </span>
    </label>
  );
}

/** A row of figures sharing one border. Put <Stat>s inside. */
export function StatGroup({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-edge bg-edge md:grid-cols-4 max-md:[&>*:last-child:nth-child(odd)]:col-span-2 ${className}`}>{children}</div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[11.5px] font-medium tracking-[0.06em] text-muted uppercase">{label}</p>
      <div className="mt-1 text-[22px] leading-tight font-light tabular-nums">{value}</div>
      {sub && <p className="mt-0.5 truncate text-[12px] text-faint">{sub}</p>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-8 text-center text-[13px] text-muted">{children}</div>;
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="portal fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/25" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-[480px] flex-col border-l border-edge bg-white">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-edge px-5">
          <h2 className="text-[17px] font-light">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-7 w-7 items-center justify-center rounded-[3px] text-muted hover:bg-stone hover:text-ink">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Avatar({ name, photo, size = 28 }: { name: string; photo?: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo} alt="" width={size} height={size} className="shrink-0 rounded-[3px] object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-[3px] bg-[#e9e8de] font-medium text-prussian"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
    >
      {initials}
    </span>
  );
}

/** Table header cell. Tables go in a `flush` Card or a `TableWrap`. */
export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`h-9 border-b border-edge bg-[#fbfbf7] px-3 text-left text-[11.5px] font-medium tracking-[0.05em] whitespace-nowrap text-muted uppercase first:pl-4 last:pr-4 ${className}`}>
      {children}
    </th>
  );
}
export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle first:pl-4 last:pr-4 ${className}`}>{children}</td>;
}

/** Standalone bordered table container (when not inside a Card). */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-[3px] border border-edge bg-white">{children}</div>;
}

/** Row class for table bodies: hairline divider and hover tint. */
export const rowCls = "border-b border-edge last:border-0 hover:bg-[#fbfbf7]";

/** Segmented filter control. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex h-8 items-center rounded-[3px] border border-[#d6d6cb] bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-full rounded-[2px] px-2.5 text-[13px] whitespace-nowrap transition-colors ${
            value === o.value ? "bg-stone font-medium text-ink shadow-[inset_0_0_0_1px_var(--color-edge)]" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Underlined tabs for switching sections of a page. */
export function Tabs<T extends string>({ value, options, onChange }: { value: T; options: readonly { value: T; label: string; count?: number }[]; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="mb-5 flex gap-5 overflow-x-auto border-b border-edge">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`-mb-px flex h-9 items-center gap-1.5 border-b-2 text-[13.5px] whitespace-nowrap transition-colors ${
            value === o.value ? "border-accent font-medium text-ink" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {o.label}
          {o.count !== undefined && <span className="text-[12px] text-faint tabular-nums">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- grades */

const gradeTones: Record<string, string> = {
  A: "bg-[#1d6b37] text-white",
  B: "bg-[#1a5f96] text-white",
  C: "bg-[#8a5a00] text-white",
  D: "bg-[#a8261b] text-white",
  F: "bg-[#a8261b] text-white",
};

const gradeSizes = {
  sm: "h-6 min-w-8 px-1 text-[13px]",
  md: "h-10 min-w-11 px-1.5 text-[20px]",
  lg: "h-16 min-w-16 px-2 text-[32px]",
} as const;

/** A report-card letter in a solid square. Without a letter, a dashed placeholder. */
export function GradeTile({ letter, size = "sm", className = "" }: { letter?: string; size?: keyof typeof gradeSizes; className?: string }) {
  const base = `inline-flex shrink-0 items-center justify-center rounded-[3px] leading-none font-medium tabular-nums ${gradeSizes[size]} ${className}`;
  if (!letter) {
    return (
      <span className={`${base} border border-dashed border-[#cfcfc4] text-faint`} role="img" aria-label="Not graded yet">
        <span aria-hidden>?</span>
      </span>
    );
  }
  return (
    <span className={`${base} ${gradeTones[letter[0]] ?? gradeTones.C}`} role="img" aria-label={`Grade ${letterLabel(letter)}`}>
      <span aria-hidden>{letter}</span>
    </span>
  );
}

/** A 1 to 5 score as a thin bar, with the number (or `display`) at the right. */
export function ScoreBar({ value, label, display }: { value?: number; label: string; display?: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr_minmax(2rem,auto)] items-center gap-3 text-[13px]">
      <span className="text-ink-2">{label}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-[#ecebe2]" aria-hidden>
        {value != null && <span className="block h-full rounded-full bg-accent" style={{ width: `${(value / 5) * 100}%` }} />}
      </span>
      <span className="text-right whitespace-nowrap text-muted tabular-nums">{display ?? (value != null ? value.toFixed(1) : "None")}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- votes */

/** "Helpful" vote, Bookface style: a caret over a count. */
export function VoteButton({ count, voted, onToggle, label, disabled }: { count: number; voted: boolean; onToggle: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={voted}
      aria-label={`${voted ? "Remove your vote for" : "Mark as helpful:"} ${label}. ${count} ${count === 1 ? "vote" : "votes"}`}
      title={disabled ? "You can't vote for your own post" : voted ? "Remove vote" : "Helpful"}
      className={`relative z-10 flex w-10 shrink-0 flex-col items-center self-start rounded-[3px] border py-1 text-[12px] leading-none tabular-nums transition-colors disabled:cursor-default ${
        voted ? "border-accent bg-[#e6f0f9] text-accent" : "border-edge bg-white text-muted enabled:hover:border-[#cfcfc4] enabled:hover:text-ink"
      }`}
    >
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor" aria-hidden>
        <path d="M6 2.5 10.5 8.5h-9z" />
      </svg>
      <span className="mt-0.5 font-medium">{count}</span>
    </button>
  );
}
