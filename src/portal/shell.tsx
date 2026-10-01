"use client";

import Link from "@/components/app-link";
import { usePagePath } from "@/lib/use-page-path";
import { useGo } from "@/lib/use-go";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/mark";
import { classStanding, fullName, isExec } from "./logic";
import { usePortal } from "./store";
import { Avatar } from "./ui";

type NavItem = { href: string; label: string; icon: string; exec?: boolean };

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "",
    items: [{ href: "/portal", label: "Home", icon: "M3 10.5 10 4l7 6.5V17a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1z" }],
  },
  {
    section: "Organization",
    items: [
      { href: "/portal/directory", label: "Directory", icon: "M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1 17a6 6 0 0 1 12 0Zm12 0a4.5 4.5 0 0 1 6-4.24V17Z" },
      { href: "/portal/projects", label: "Projects", icon: "M3 4h5l2 2h7v10H3z" },
      { href: "/portal/archive", label: "Archive", icon: "M3 3h14v4H3zm1 5h12v9H4zm4 3h4" },
    ],
  },
  {
    section: "Recruiting",
    items: [
      { href: "/portal/recruiting", label: "My Recruiting", icon: "M4 3h12v14H4zm3 4h6M7 10h6M7 13h4" },
      { href: "/portal/companies", label: "Companies", icon: "M3 17V6l7-3 7 3v11zm4-6h2v6H7zm4 0h2v6h-2z" },
      { href: "/portal/network", label: "Network", icon: "M10 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM4 12a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm12 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM10 9v3m0 0-5 2m5-2 5 2" },
    ],
  },
  {
    section: "Exec",
    items: [
      { href: "/portal/admin", label: "Members & Roles", icon: "M10 2 3 5v5c0 4 3 7 7 8 4-1 7-4 7-8V5z", exec: true },
      { href: "/portal/admin/tasks", label: "Recurring Tasks", icon: "M4 4h12v13H4zm3-2v4m6-4v4M7 10l2 2 4-4", exec: true },
      { href: "/portal/admin/website", label: "Website", icon: "M2 4h16v12H2zm0 3h16", exec: true },
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
    return <div className="flex min-h-dvh items-center justify-center bg-cloud text-sm text-slate">Loading…</div>;
  }

  const exec = isExec(me);
  const active = (href: string) => (href === "/portal" ? pathname === "/portal" : pathname === href || pathname.startsWith(`${href}/`));

  const sidebar = (
    <nav className="flex h-full flex-col bg-graphite text-white" aria-label="Portal">
      <div className="flex h-16 items-center px-5">
        <Link href="/" className="text-white" aria-label="Public website">
          <Logo />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {NAV.map((group) => {
          const items = group.items.filter((i) => !i.exec || exec);
          if (!items.length) return null;
          return (
            <div key={group.section || "root"} className="mt-5">
              {group.section && <p className="px-3 pb-2 text-[0.68rem] font-semibold tracking-[0.12em] text-white/40 uppercase">{group.section}</p>}
              <ul className="space-y-0.5">
                {items.map((i) => (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                        active(i.href) ? "bg-white/10 font-semibold text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
                        <path d={i.icon} />
                      </svg>
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/10 p-3">
        <Link href="/portal/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 px-2 py-2 hover:bg-white/5">
          <Avatar name={fullName(me)} photo={me.photo} size={32} />
          <span className="min-w-0 text-sm">
            <span className="block truncate font-semibold">{fullName(me)}</span>
            <span className="block truncate text-xs text-white/55">{me.execTitle ?? me.role}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => {
            signOut();
            go("/login", { replace: true });
          }}
          className="mt-1 w-full px-2 py-1.5 text-left text-xs text-white/50 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div data-style="classic" className="min-h-dvh bg-cloud">
      <aside className="fixed inset-y-0 left-0 hidden w-60 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64">{sidebar}</div>
        </div>
      )}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button type="button" className="p-1 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>
            <span className="text-sm text-slate">
              {me.school} · Class of {me.gradYear} · {classStanding(me.gradYear)}
            </span>
          </div>
          <span className="hidden bg-[#fdf3e1] px-2 py-1 text-xs font-medium text-[#8a5a00] sm:inline">Preview: sample data, saved in this browser</span>
        </header>
        <main className="px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
