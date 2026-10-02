"use client";

import Image from "next/image";
import Link from "@/components/app-link";
import { PageIntro, Photo } from "../editorial";
import type { PublicMember } from "@/lib/site-content";
import { useSiteContent } from "@/lib/use-site-content";

function Portrait({ m }: { m: PublicMember }) {
  return (
    <li>
      <div className="relative aspect-[4/5] overflow-hidden bg-stone">
        {m.photo ? (
          <Image src={m.photo} alt={m.name} fill sizes="(min-width:1024px) 20vw, 50vw" className="object-cover" />
        ) : (
          <span aria-hidden className="display absolute inset-0 flex items-center justify-center text-5xl text-faint">
            {m.name
              .split(/[\s-]+/)
              .slice(0, 2)
              .map((s) => s[0])
              .join("")}
          </span>
        )}
      </div>
      <p className="mt-3 font-medium">{m.name}</p>
      <p className="text-sm text-muted">{m.role}</p>
    </li>
  );
}

export function PeopleView() {
  const { groups, roster } = useSiteContent();
  const sections = groups.map((group) => ({ group, members: roster.filter((m) => m.group === group) })).filter((g) => g.members.length);
  const total = roster.length;

  return (
    <>
      <PageIntro
        title="People"
        intro={`Graphite is run entirely by students: ${total} members from Pomona, Claremont McKenna, Harvey Mudd, Scripps and Pitzer.`}
      />
      <div className="wrap">
        <Photo src="/images/group-stairs.jpg" alt="Graphite Group on the Kravis Center stairs" ratio="aspect-[16/9] md:aspect-[21/9]" position="50% 28%" priority />
      </div>

      {sections.map(({ group, members }, i) => {
        // Portraits when the group has photos (or for the executive board); otherwise a clean list.
        const portraits = i === 0 || members.every((m) => m.photo);
        return (
          <section key={group} className="wrap grid gap-8 border-b border-line py-16 md:grid-cols-12 md:py-20">
            <h2 className="text-[0.9375rem] text-muted md:col-span-3">
              {group}
              <span className="ml-2 text-faint">{members.length}</span>
            </h2>
            <div className="md:col-span-9">
              {portraits ? (
                <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
                  {members.map((m) => (
                    <Portrait key={m.id} m={m} />
                  ))}
                </ul>
              ) : (
                <ul className="grid border-t border-ink sm:grid-cols-2 sm:gap-x-10">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-baseline justify-between gap-4 border-b border-line py-3.5">
                      <span className="font-medium">{m.name}</span>
                      <span className="text-right text-sm text-muted">{m.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}

      <section className="wrap flex flex-col justify-between gap-8 py-20 md:flex-row md:items-end">
        <p className="display max-w-2xl text-display-m">Join the next class.</p>
        <Link href="/students" className="cta text-lg">
          Membership and recruiting
        </Link>
      </section>
    </>
  );
}
