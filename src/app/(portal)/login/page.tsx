"use client";

import Image from "next/image";
import Link from "@/components/app-link";
import { useGo } from "@/lib/use-go";
import { Logo, Mark } from "@/components/mark";
import { usePortal } from "@/portal/store";

const demoUsers = [
  { id: "m1", label: "Managing Director", note: "Exec view: members, tasks, website editor" },
  { id: "m9", label: "Consultant", note: "Member view: recruiting, network, projects" },
  { id: "m14", label: "New Associate Consultant", note: "First-semester view with onboarding tasks" },
];

export default function LoginPage() {
  const { signIn, data } = usePortal();
  const go = useGo();

  const enter = (id: string) => {
    signIn(id);
    go("/portal");
  };

  return (
    <div data-style="classic" className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden bg-graphite lg:block">
        <Image src="/images/group-lawn.jpg" alt="" fill sizes="50vw" className="object-cover opacity-40" priority />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="text-white">
            <Logo />
          </Link>
          <div>
            <p className="max-w-md font-serif text-4xl leading-tight">The institutional memory of Graphite Group.</p>
            <p className="mt-4 max-w-md text-white/70">
              Members, recruiting, networks and every past project, kept current from one class to the next.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-cloud px-5 py-16">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex text-ink lg:hidden">
            <Logo />
          </Link>
          <div className="border-t-[3px] border-accent bg-white p-8 shadow-[0_1px_3px_rgba(20,24,29,0.06)]">
            <Mark className="h-9 w-9 text-ink" />
            <h1 className="mt-6 font-serif text-3xl">Log in</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Use your Claremont Colleges Google account. First-time members complete a short profile.
            </p>
            <button
              type="button"
              disabled
              title="Connects when the database is set up"
              className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-3 border border-line bg-white px-4 py-3 text-sm font-semibold text-ink opacity-60"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
              </svg>
              Continue with Google
            </button>

            <div className="my-7 flex items-center gap-3 text-xs text-slate">
              <span className="h-px flex-1 bg-line" />
              Preview the portal as
              <span className="h-px flex-1 bg-line" />
            </div>

            <ul className="space-y-2">
              {demoUsers.map((u) => {
                const m = data.members.find((x) => x.id === u.id);
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => enter(u.id)}
                      className="flex w-full items-center justify-between border border-line px-4 py-3 text-left transition-colors hover:border-accent hover:bg-cloud"
                    >
                      <span>
                        <span className="block text-sm font-semibold">{u.label}</span>
                        <span className="block text-xs text-slate">
                          {m ? `${m.firstName} ${m.lastName} · ` : ""}
                          {u.note}
                        </span>
                      </span>
                      <span aria-hidden className="text-slate">
                        →
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-slate">
              Preview only: sample people and data, saved in your browser. Google sign-in, restricted to 5C email
              addresses, turns on when the database is connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
