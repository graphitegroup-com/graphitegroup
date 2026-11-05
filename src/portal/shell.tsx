"use client";

import Link from "@/components/app-link";
import { useEffect, useState, type ReactNode } from "react";
import { MarkTile } from "@/components/mark";
import { useGo } from "@/lib/use-go";
import { usePagePath } from "@/lib/use-page-path";
import { STATIC_PREVIEW } from "@/lib/preview";
import { fullName, isAlum, isExec } from "./logic";
import { usePortal } from "./store";
import { Avatar } from "./ui";

/** 16px line icons, drawn on a 24 grid. */
const ICONS = {
  home: "M3.5 10.5 12 3.5l8.5 7M5.5 9v11h13V9",
  forum: "M4.5 4.5h15a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H10l-4.5 3.5V16h-1a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1zM8 9h8M8 12h5",
  recruiting: "M3.5 8h17v11.5h-17zM8.5 8V5.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5V8M3.5 13h17",
  companies: "M5 20.5V4.5h9v16M14 9.5h5v11M3 20.5h18M8 8h3M8 11.5h3M8 15h3",
  network: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18.5 14a6.5 6.5 0 0 1 3 6",
  directory: "M5 3.5h14v17H5zM12 12a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5zM8 17.5a4 4 0 0 1 8 0",
  projects: "M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z",
  members: "M12 3.5 4.5 6.5v5.5c0 4.2 3.2 7.6 7.5 8.5 4.3-.9 7.5-4.3 7.5-8.5V6.5z",
  tasks: "M4.5 12a7.5 7.5 0 0 1 13-5.1L19.5 9M19.5 4v5h-5M19.5 12a7.5 7.5 0 0 1-13 5.1L4.5 15M4.5 20v-5h5",
  website: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM3.5 12h17M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.2-3.5-8.5s1.2-6.2 3.5-8.5z",
  menu: "M4 7h16M4 12h16M4 17h16",
} as const;

function Icon({ name, className = "h-4 w-4" }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  );
}

/** `members`: hidden from alumni, who only need the forum and the shared pages. */
type NavItem = { href: string; label: string; icon: keyof typeof ICONS; exec?: boolean; members?: boolean };

const NAV: { section?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/portal", label: "Home", icon: "home", members: true },
      { href: "/portal/forum", label: "Forum", icon: "forum" },
    ],
  },
  {
    section: "Recruiting",
    items: [
      { href: "/portal/recruiting", label: "My recruiting", icon: "recruiting", members: true },
      { href: "/portal/companies", label: "Companies", icon: "companies" },
      { href: "/portal/network", label: "Network", icon: "network" },
    ],
  },
  {
    section: "Graphite",
    items: [
      { href: "/portal/directory", label: "Directory", icon: "directory" },
      { href: "/portal/projects", label: "Projects", icon: "projects" },
    ],
  },
  {
    section: "Executive board",
    items: [
      { href: "/portal/admin", label: "Members and roles", icon: "members", exec: true },
      { href: "/portal/admin/tasks", label: "Recurring tasks", icon: "tasks", exec: true },
    ],
  },
];

export function PortalShell({ children }: { children: ReactNode }) {
  const { me, ready, signOut, live, needsSetup, recovering, error, dismissError, viewingAs, realMe, viewAs } = usePortal();
  const pathname = usePagePath();
  const go = useGo();
  const [open, setOpen] = useState(false);

  // Signed out, still setting up, or here from a password-reset link: the sign-in page handles all three.
  const toLogin = ready && (!me || needsSetup || recovering);
  useEffect(() => {
    if (toLogin) go("/login", { replace: true });
  }, [toLogin, go]);

  if (!ready || !me || toLogin) {
    return <div className="portal flex min-h-dvh items-center justify-center bg-white text-muted">Loading</div>;
  }

  const exec = isExec(me);
  const alum = isAlum(me);
  const home = alum ? "/portal/forum" : "/portal";
  const active = (href: string) =>
    href === "/portal" ? pathname === "/portal" : href === "/portal/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <nav className="flex h-full flex-col border-r border-edge bg-white" aria-label="Portal">
      <Link href={home} className="flex h-16 shrink-0 items-center gap-2.5 px-4" aria-label="Portal home">
        <MarkTile size={28} />
        <span className="text-[19px] leading-none font-light tracking-[-0.01em]">Graphite Group</span>
      </Link>
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {NAV.map((group, gi) => {
          const items = group.items.filter((i) => (!i.exec || exec) && (!i.members || !alum));
          if (!items.length) return null;
          return (
            <div key={gi} className={gi ? "mt-4" : ""}>
              {group.section && <p className="px-2 pb-1 text-[11px] font-medium tracking-[0.06em] text-faint uppercase">{group.section}</p>}
              <ul className="space-y-px">
                {items.map((i) => {
                  const on = active(i.href);
                  return (
                    <li key={i.href}>
                      <Link
                        href={i.href}
                        onClick={() => setOpen(false)}
                        aria-current={on ? "page" : undefined}
                        className={`flex h-8 items-center gap-2.5 rounded-[3px] px-2 text-[13.5px] transition-colors ${
                          on ? "bg-stone font-medium text-ink" : "text-ink-2 hover:bg-stone"
                        }`}
                      >
                        <Icon name={i.icon} className={`h-4 w-4 ${on ? "text-accent" : "text-faint"}`} />
                        {i.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t border-edge p-2">
        <Link
          href="/portal/profile"
          onClick={() => setOpen(false)}
          aria-current={pathname === "/portal/profile" ? "page" : undefined}
          className={`flex items-center gap-2.5 rounded-[3px] px-2 py-1.5 ${pathname === "/portal/profile" ? "bg-stone" : "hover:bg-stone"}`}
        >
          <Avatar name={fullName(me)} photo={me.photo} size={28} />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-medium">{fullName(me)}</span>
            <span className="block truncate text-[12px] text-muted">{me.execTitle ?? me.role}</span>
          </span>
        </Link>
        <button
          type="button"
          className="mt-1 flex h-8 w-full items-center rounded-[3px] px-2 text-left text-[13px] text-muted hover:bg-stone hover:text-ink"
          onClick={() => {
            signOut();
            if (!live) go("/login", { replace: true });
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="portal min-h-dvh bg-white">
      <aside className="fixed inset-y-0 left-0 hidden w-[232px] lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <div className="relative h-full w-[260px]">{sidebar}</div>
        </div>
      )}
      <div className="lg:pl-[232px]">
        <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-edge bg-white px-4 lg:hidden">
          <Link href={home} className="flex items-center gap-2">
            <MarkTile size={24} />
            <span className="text-[16px] font-light">Graphite Group</span>
          </Link>
          <button type="button" aria-label="Open menu" className="flex h-8 w-8 items-center justify-center rounded-[3px] hover:bg-stone" onClick={() => setOpen(true)}>
            <Icon name="menu" className="h-5 w-5" />
          </button>
        </header>
        {STATIC_PREVIEW && !live && (
          <div className="border-b border-edge bg-[#fbf1da] px-4 py-1.5 text-center text-[12px] text-[#5c4300] md:px-8">
            Preview with sample data. Changes are saved in this browser only.
          </div>
        )}
        {viewingAs && (
          <div className="sticky top-12 z-30 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-[#b9d3ea] bg-[#e8f1fa] px-4 py-2 text-[13px] text-[#0f3b63] md:px-8 lg:top-0">
            <span>
              Viewing the portal as <span className="font-medium">{fullName(viewingAs)}</span> ({isAlum(viewingAs) ? `alum, class of ${viewingAs.gradYear}` : viewingAs.execTitle ?? viewingAs.role}).
              Changes are off.
            </span>
            <button
              type="button"
              onClick={() => {
                viewAs(null);
                go("/portal/admin");
              }}
              className="shrink-0 font-medium hover:underline"
            >
              Back to {realMe ? `${realMe.firstName}'s` : "my"} view
            </button>
          </div>
        )}
        {error && (
          <div role="alert" className="flex items-start justify-between gap-3 border-b border-[#f0c9c5] bg-[#fbe9e8] px-4 py-2 text-[13px] text-[#a8261b] md:px-8">
            <span>
              {error}
              {!viewingAs && " The page has been refreshed to match what's saved."}
            </span>
            <button type="button" onClick={dismissError} className="shrink-0 font-medium hover:underline">
              Dismiss
            </button>
          </div>
        )}
        <main className="mx-auto max-w-[1180px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
