"use client";

import Link from "@/components/app-link";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/mark";
import { useGo } from "@/lib/use-go";
import { usePagePath } from "@/lib/use-page-path";
import { STATIC_PREVIEW } from "@/lib/preview";
import { fullName, isExec } from "./logic";
import { usePortal } from "./store";
import { Avatar } from "./ui";

type NavItem = { href: string; label: string; exec?: boolean };

const NAV: { section?: string; items: NavItem[] }[] = [
  { items: [{ href: "/portal", label: "Home" }] },
  {
    section: "Recruiting",
    items: [
      { href: "/portal/recruiting", label: "My recruiting" },
      { href: "/portal/companies", label: "Companies" },
      { href: "/portal/network", label: "Network" },
    ],
  },
  {
    section: "Graphite",
    items: [
      { href: "/portal/directory", label: "Directory" },
      { href: "/portal/projects", label: "Projects" },
      { href: "/portal/archive", label: "Archive" },
    ],
  },
  {
    section: "Executive board",
    items: [
      { href: "/portal/admin", label: "Members and roles", exec: true },
      { href: "/portal/admin/tasks", label: "Recurring tasks", exec: true },
      { href: "/portal/admin/website", label: "Website", exec: true },
    ],
  },
];

export function PortalShell({ children }: { children: ReactNode }) {
  const { me, ready, signOut } = usePortal();
  const pathname = usePagePath();
  const go = useGo();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && !me) go("/login", { replace: true });
  }, [ready, me, go]);

  if (!ready || !me) {
    return <div className="flex min-h-dvh items-center justify-center text-sm text-muted">Loading</div>;
  }

  const exec = isExec(me);
  const active = (href: string) =>
    href === "/portal" ? pathname === "/portal" : href === "/portal/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <nav className="flex h-full flex-col bg-stone" aria-label="Portal">
      <div className="flex h-[76px] items-center px-6">
        <Link href="/portal" className="text-ink" aria-label="Portal home">
          <Logo />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {NAV.map((group, gi) => {
          const items = group.items.filter((i) => !i.exec || exec);
          if (!items.length) return null;
          return (
            <div key={gi} className={gi ? "mt-7" : "mt-2"}>
              {group.section && <p className="px-3 pb-1.5 text-[0.8125rem] text-muted">{group.section}</p>}
              <ul>
                {items.map((i) => (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={() => setOpen(false)}
                      aria-current={active(i.href) ? "page" : undefined}
                      className={`block rounded-full px-3.5 py-1.5 text-[0.9375rem] transition-colors ${
                        active(i.href) ? "bg-white font-medium text-ink shadow-[0_0_0_1px_rgba(7,56,99,0.08)]" : "text-ink-2 hover:text-ink"
                      }`}
                    >
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t border-line px-6 py-5">
        <Link href="/portal/profile" onClick={() => setOpen(false)} className="flex items-center gap-3">
          <Avatar name={fullName(me)} photo={me.photo} size={34} />
          <span className="min-w-0 text-sm leading-tight">
            <span className="block truncate font-medium">{fullName(me)}</span>
            <span className="block truncate text-muted">{me.execTitle ?? me.role}</span>
          </span>
        </Link>
        <div className="mt-4 flex gap-4 text-sm text-muted">
          <Link href="/" className="hover:text-ink">
            Public site
          </Link>
          <button
            type="button"
            className="hover:text-ink"
            onClick={() => {
              signOut();
              go("/login", { replace: true });
            }}
          >
            Log out
          </button>
        </div>
        {STATIC_PREVIEW && <p className="mt-4 text-xs leading-relaxed text-muted">Preview with sample data, saved in this browser only.</p>}
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#fafbfd]">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/25" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64 shadow-xl">{sidebar}</div>
        </div>
      )}
      <div className="lg:pl-60">
        <header className="flex h-[64px] items-center justify-between border-b border-line bg-white px-5 lg:hidden">
          <Link href="/portal" className="text-ink">
            <Logo />
          </Link>
          <button type="button" className="pill pill-sm !py-2.5" onClick={() => setOpen(true)}>
            Menu
          </button>
        </header>
        <main className="mx-auto max-w-[72rem] px-5 py-10 md:px-10 md:py-14">{children}</main>
      </div>
    </div>
  );
}
