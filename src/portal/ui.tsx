"use client";

import Link from "@/components/app-link";
import { useEffect, type ReactNode } from "react";

/*
  Portal UI kit. Built like a working tool rather than a marketing page:
  14px type, 1px borders, 6px corners, no shadows or gradients, and Prussian
  Blue as the single accent. Every portal page should be assembled from these.
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
        <nav aria-label="Breadcrumb" className="mb-2 text-[13px] text-muted">
          <Link href={back.href} className="hover:text-ink">
            {back.label}
          </Link>
          <span className="mx-1.5 text-faint">/</span>
        </nav>
      )}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h1 className="text-[22px] leading-tight font-semibold">{title}</h1>
          {sub && <div className="mt-1 max-w-2xl text-[13.5px] text-muted">{sub}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
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
    <section className={`min-w-0 overflow-hidden rounded-lg border border-edge bg-white ${className}`}>
      {title && (
        <header className="flex min-h-11 items-center justify-between gap-4 border-b border-edge px-4 py-2">
          <h2 className="text-[13.5px] font-semibold">{title}</h2>
          {action && <div className="text-[13px] text-muted">{action}</div>}
        </header>
      )}
      <div className={flush ? "" : "px-4 py-1"}>{children}</div>
    </section>
  );
}

const tones = {
  gray: "bg-[#f1f3f5] text-[#4a5160]",
  blue: "bg-[#e9eefb] text-[#2846a8]",
  green: "bg-[#e5f3e9] text-[#1d6b37]",
  amber: "bg-[#fbf1da] text-[#7f5300]",
  red: "bg-[#fbe9e8] text-[#a8261b]",
  dark: "bg-ink text-white",
} as const;

export type Tone = keyof typeof tones;

/** Status label. */
export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex h-5 items-center rounded-[4px] px-1.5 text-[12px] leading-none font-medium whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}

const buttonVariants = {
  primary: "h-8 px-3 bg-prussian text-white hover:bg-[#0a477c]",
  secondary: "h-8 px-3 border border-edge bg-white text-ink hover:bg-stone",
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
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${buttonVariants[variant]} ${className}`}
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
  const cls = `inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors ${buttonVariants[variant]} ${className}`;
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

export const fieldCls =
  "w-full rounded-md border border-edge bg-white px-2.5 text-[13.5px] text-ink placeholder:text-faint focus:border-sapphire focus:ring-2 focus:ring-sapphire/15 focus:outline-none read-only:bg-stone read-only:text-muted";

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
  return <input {...props} className={`${fieldCls} h-8 ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${fieldCls} resize-y py-1.5 leading-relaxed ${props.className ?? ""}`} />;
}

export function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[] }) {
  return (
    <select {...props} className={`${fieldCls} h-8 pr-7 ${props.className ?? ""}`}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** A row of figures sharing one border. Put <Stat>s inside. */
export function StatGroup({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-edge bg-edge md:grid-cols-4 ${className}`}>{children}</div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[12.5px] text-muted">{label}</p>
      <p className="mt-0.5 text-[22px] leading-tight font-semibold tabular-nums">{value}</p>
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
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-[460px] flex-col border-l border-edge bg-white">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-edge px-5">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-stone hover:text-ink">
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
    <img src={photo} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-[#e9edf3] font-medium text-prussian"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
    >
      {initials}
    </span>
  );
}

/** Table header cell. Tables go in a `flush` Card or a `TableWrap`. */
export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`h-9 border-b border-edge bg-stone px-3 text-left text-[12px] font-medium whitespace-nowrap text-muted first:pl-4 last:pr-4 ${className}`}>
      {children}
    </th>
  );
}
export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle first:pl-4 last:pr-4 ${className}`}>{children}</td>;
}

/** Standalone bordered table container (when not inside a Card). */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-lg border border-edge bg-white">{children}</div>;
}

/** Row class for table bodies: hairline divider and hover tint. */
export const rowCls = "border-b border-edge last:border-0 hover:bg-[#fafbfc]";

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
    <div role="group" aria-label={label} className="inline-flex h-8 items-center rounded-md border border-edge bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-full rounded-[4px] px-2.5 text-[13px] whitespace-nowrap transition-colors ${
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
            value === o.value ? "border-prussian font-medium text-ink" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {o.label}
          {o.count !== undefined && <span className="text-[12px] text-faint tabular-nums">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
