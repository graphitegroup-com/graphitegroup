"use client";

import Link from "@/components/app-link";
import { useEffect, type ReactNode } from "react";

/*
  Portal UI kit. Same language as the public site: gradient titles, pill
  buttons, white boxes with a soft glow, Inter throughout.
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
    <header className="mb-10">
      {back && (
        <Link href={back.href} className="mb-5 inline-block text-sm text-muted hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="min-w-0">
          <h1 className="grad-title t-h2 pb-1">{title}</h1>
          {sub && <div className="mt-3 max-w-2xl leading-relaxed text-muted">{sub}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** A white box with an optional title row. */
export function Card({
  children,
  className = "",
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={`card-glow min-w-0 rounded-[8px] bg-white px-6 py-5 ${className}`}>
      {title && (
        <header className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
          <h2 className="text-[1.0625rem] font-semibold tracking-[-0.03em]">{title}</h2>
          {action && <div className="text-sm">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

const dots = {
  gray: "bg-faint",
  blue: "bg-accent",
  green: "bg-[#2f7d4f]",
  amber: "bg-[#c08419]",
  red: "bg-[#b4423c]",
  dark: "bg-ink",
} as const;

/** Status marker: a small dot and a word. */
export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: keyof typeof dots }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.8125rem] whitespace-nowrap text-ink-2">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const v = {
    primary: "pill",
    secondary: "rounded-full border border-pewter bg-white text-ink hover:bg-pewter",
    ghost: "text-muted hover:text-ink",
    danger: "text-[#b4423c] hover:underline",
  }[variant];
  const pad = variant === "ghost" || variant === "danger" ? "px-1.5 py-1.5" : "!px-5 !py-2.5";
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${pad} ${v} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

const fieldCls =
  "w-full rounded-[6px] border border-[#dfe3ec] bg-white px-3 py-2 text-[0.9375rem] text-ink placeholder:text-faint focus:border-sapphire focus:outline-none";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldCls} ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${fieldCls} resize-y ${props.className ?? ""}`} />;
}

export function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[] }) {
  return (
    <select {...props} className={`${fieldCls} ${props.className ?? ""}`}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** A figure with its label, no box. */
export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-[8px] bg-gray px-5 py-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="grad-title mt-1 pb-1 text-[2.25rem] leading-none font-semibold tracking-[-0.05em] tabular-nums">{value}</p>
      {sub && <p className="mt-2 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="py-10 text-sm text-muted">{children}</div>;
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
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/25" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col bg-paper shadow-[0_0_60px_rgba(0,0,0,0.12)]">
        <header className="flex items-center justify-between px-7 pt-7 pb-4">
          <h2 className="grad-title t-h3 pb-1">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            Close
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-7 pb-10">{children}</div>
      </div>
    </div>
  );
}

export function Avatar({ name, photo, size = 36 }: { name: string; photo?: string; size?: number }) {
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
      className="flex shrink-0 items-center justify-center rounded-full bg-gray font-medium text-prussian"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.34) }}
    >
      {initials}
    </span>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`py-2.5 pr-4 text-left text-[0.8125rem] font-normal text-muted ${className}`}>{children}</th>;
}
export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`py-3.5 pr-4 align-top ${className}`}>{children}</td>;
}
